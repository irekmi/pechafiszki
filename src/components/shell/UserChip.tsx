import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

/** `.userchip` — the avatar and nickname linking to SCR-14; the nickname is hidden below 768 px (DL-07). */
export function UserChip({ nickname }: { nickname: string }) {
  return (
    <Link
      href="/profil"
      className="flex items-center gap-2.5 pl-1 pr-3 py-1 border border-white/20 rounded-pill text-on-brand no-underline text-14 font-medium hover:text-white hover:border-gold"
    >
      <Avatar name={nickname} />
      <span className="hidden md:inline">{nickname}</span>
    </Link>
  );
}
