"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle, Store } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";

export function ShopLinkCard({ slug, shopName }: { slug: string; shopName: string }) {
  const [origin, setOrigin] = useState("https://setlou.com");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const shopLink = `${origin}/boutique/${slug}`;
  const shareMessage = `Découvrez les articles de ${shopName} et commandez directement ici : ${shopLink}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shopLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Lien boutique copié !");
  };

  return (
    <div className="rounded-xl border bg-primary/5 p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Store className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-semibold text-sm">Mon lien boutique</p>
          <p className="text-xs text-muted-foreground">
            Mettez-le dans votre bio TikTok / Instagram : vos clients commandent et paient seuls.
          </p>
          <p className="text-xs font-mono truncate mt-1">{shopLink}</p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 mr-1 text-green-600" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? "Copié" : "Copier"}
        </Button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: "sm", className: "bg-[#25D366] hover:bg-[#20bd5a] text-white" })}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Partager
        </a>
        <a
          href={shopLink}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "sm" })}
          title="Voir ma boutique"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
