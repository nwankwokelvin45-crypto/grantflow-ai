"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import DeleteGrantButton from "./DeleteGrantButton";

interface Props {
  grantId: string;
  grantTitle: string;
}

export default function GrantCardActions({ grantId, grantTitle }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Link href={`/grants/${grantId}/write`}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
        style={{ background: "linear-gradient(135deg, var(--navy-light), var(--navy))" }}>
        <Pencil className="h-3.5 w-3.5" />
        Write
      </Link>
      <DeleteGrantButton grantId={grantId} grantTitle={grantTitle} variant="icon" />
    </div>
  );
}
