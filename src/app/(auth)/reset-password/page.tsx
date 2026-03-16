import { Suspense } from 'react';
import { ResetPasswordForm } from './reset-password-form';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
          <div className="w-full max-w-md text-center text-muted-foreground">
            Laden...
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
