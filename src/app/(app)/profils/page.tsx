import { getShopProfiles } from "@/server/data/supabase-store";
import { ProfilesTable } from "@/components/profiles/profiles-table";
import { ProfileDialog } from "@/components/profiles/profile-dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default async function ProfilesPage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q.toLowerCase() : "";
  
  let profiles = await getShopProfiles();
  
  if (query) {
    profiles = profiles.filter(p => 
      p.full_name.toLowerCase().includes(query) || 
      p.username.toLowerCase().includes(query) ||
      p.whatsapp_number.includes(query)
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Équipe & Assistants</h2>
          <p className="text-muted-foreground mt-1">
            Gérez les accès de vos collaborateurs à votre boutique.
          </p>
        </div>
        <ProfileDialog />
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <form method="GET" action="/profils">
            <Input 
              name="q"
              placeholder="Rechercher par nom, identifiant..." 
              className="pl-9 bg-card"
              defaultValue={query}
            />
          </form>
        </div>
      </div>
      
      <ProfilesTable profiles={profiles} />
    </div>
  );
}
