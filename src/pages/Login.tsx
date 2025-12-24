"use client";

import { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { showSuccess } from "@/utils/toast"; // Removed showError as it's not used for this event type

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        showSuccess("Connexion réussie !");
        navigate("/"); // Rediriger vers le tableau de bord après connexion
      } else if (event === 'SIGNED_OUT') {
        showSuccess("Déconnexion réussie.");
      }
      // Removed the 'AUTH_API_ERROR' check as it's not a valid event type for onAuthStateChange.
      // The Auth component handles its own error display.
    });

    // Nettoyage de l'écouteur d'état d'authentification
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connectez-vous à votre compte
          </h2>
        </div>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Vous pouvez ajouter des fournisseurs comme 'google', 'github' ici
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="light"
          redirectTo={window.location.origin} // Redirige après l'authentification (ex: email confirmation)
        />
      </div>
    </div>
  );
};

export default Login;