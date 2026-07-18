"use client";

import { useParams } from "next/navigation";
import { ArticleEditor } from "@/components/knowledge/ArticleEditor";

export default function KnowledgeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!id) {
    return null;
  }

  return <ArticleEditor articleId={id} />;
}
