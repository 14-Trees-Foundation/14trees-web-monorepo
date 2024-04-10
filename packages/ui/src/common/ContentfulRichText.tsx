"use client";

import { Block, Document, Inline, Text } from "@contentful/rich-text-types";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
import { ReactNode, useEffect, useState } from "react";

export function HTMLRichText(props: { content: Document }) {
  return documentToHtmlString(props.content);
}

export default function ContentfulRichText(props: { content: Document }) {
  return documentToReactComponents(props.content);
}

export function ClientReactRichText(props: { content: Document }) {
  const [richTextComponent, setRichTextComponent] = useState<ReactNode>(null);
  useEffect(() => {
    setRichTextComponent(documentToReactComponents(props.content));
  }, [props.content]);

  return <div>{richTextComponent || ""}</div>;
}

export type { Block, Document, Inline, Text };

