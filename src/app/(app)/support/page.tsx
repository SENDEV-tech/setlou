import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Mail, MessageCircle, Phone } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Aide et Support</h2>
          <p className="text-muted-foreground mt-1">
            Besoin d'aide avec votre boutique ? Contactez notre équipe technique.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20 shadow-md">
          <CardHeader>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6" />
            </div>
            <CardTitle>WhatsApp Direct</CardTitle>
            <CardDescription>
              La méthode la plus rapide pour obtenir de l'aide. Notre équipe vous répond en quelques minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a 
              href="https://wa.me/221770000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className={buttonVariants({ size: "lg", className: "w-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg" })}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Discuter sur WhatsApp
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
              <Mail className="h-6 w-6" />
            </div>
            <CardTitle>Support par Email</CardTitle>
            <CardDescription>
              Pour des requêtes plus complexes ou des signalements de bugs détaillés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a 
              href="mailto:support@setlou.com"
              className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}
            >
              <Mail className="mr-2 h-5 w-5" />
              support@setlou.com
            </a>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">FAQ & Ressources (À venir)</CardTitle>
          <CardDescription>
            Bientôt, vous retrouverez ici des tutoriels vidéo et des articles pour vous aider à mieux utiliser Setlou.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
