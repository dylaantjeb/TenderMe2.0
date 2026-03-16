import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database is niet geconfigureerd. Stel DATABASE_URL in via de Vercel omgevingsvariabelen.' },
        { status: 503 }
      );
    }

    const body = await req.json();

    // Mode 1: Request password reset (email provided, no token)
    if (body.email && !body.token) {
      const { email } = body;

      // Always return success to prevent email enumeration
      const user = await db.user.findUnique({
        where: { email },
      });

      if (user) {
        // Delete any existing reset tokens for this email
        await db.verificationToken.deleteMany({
          where: { identifier: email },
        });

        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.verificationToken.create({
          data: {
            identifier: email,
            token,
            expires,
          },
        });

        // In production, send an email with the reset link
        console.log(`[Password Reset] Email would be sent to: ${email}`);
        console.log(`[Password Reset] Reset link: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Als dit emailadres bij ons bekend is, ontvangt u een e-mail met instructies om uw wachtwoord te resetten.',
      });
    }

    // Mode 2: Complete password reset (token + new password)
    if (body.token && body.password) {
      const { token, password } = body;

      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Wachtwoord moet minimaal 8 tekens bevatten' },
          { status: 400 }
        );
      }

      const verificationToken = await db.verificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken) {
        return NextResponse.json(
          { error: 'Ongeldige of verlopen reset link. Vraag een nieuwe aan.' },
          { status: 400 }
        );
      }

      if (verificationToken.expires < new Date()) {
        // Clean up expired token
        await db.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: verificationToken.identifier,
              token: verificationToken.token,
            },
          },
        });

        return NextResponse.json(
          { error: 'Deze reset link is verlopen. Vraag een nieuwe aan.' },
          { status: 400 }
        );
      }

      const user = await db.user.findUnique({
        where: { email: verificationToken.identifier },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Gebruiker niet gevonden.' },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 12);

      await db.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Delete the used token
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Uw wachtwoord is succesvol gewijzigd. U kunt nu inloggen.',
      });
    }

    return NextResponse.json(
      { error: 'Ongeldig verzoek. Geef een email of token met wachtwoord op.' },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Onbekende fout';
    console.error('Password reset error:', message);

    let userMessage = 'Er is een fout opgetreden bij het resetten van uw wachtwoord';
    let status = 500;

    if (message.includes('DATABASE_URL')) {
      userMessage = 'Database is niet geconfigureerd. Stel DATABASE_URL in via de Vercel omgevingsvariabelen.';
      status = 503;
    } else if (message.includes('does not exist') || message.includes('relation') || message.includes('P2021')) {
      userMessage = 'Database tabellen bestaan nog niet. Ga naar /api/setup om de database te initialiseren.';
      status = 503;
    }

    return NextResponse.json(
      { error: userMessage },
      { status }
    );
  }
}
