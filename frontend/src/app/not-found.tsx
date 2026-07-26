import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-headline">Page introuvable</h1>
      <p className="text-body-sm text-muted-foreground mt-2">
        Cette adresse ne correspond à aucune page de la plateforme.
      </p>
      <Button render={<Link href="/cases" />} className="mt-6">
        Retour aux dossiers
      </Button>
    </main>
  );
}
