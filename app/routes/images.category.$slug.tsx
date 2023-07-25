import type { V2_MetaFunction } from "@remix-run/cloudflare";
import { redirect } from '@remix-run/cloudflare';
import type { LoaderArgs, ActionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from "@remix-run/react";
import type { InferModel } from 'drizzle-orm';
import { createClient } from "~/db/client.server"
import { categories, images } from '~/db/schema';
import { eq } from "drizzle-orm";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async ({ params, context }: LoaderArgs) => {
  const db = createClient(context.env.DB as D1Database);
  const categoryId = params.slug
  const category = await db.select().from(categories).where(eq(categories.id, categoryId)).all()
  const image = await db.select().from(images).where(eq(images.category_id, categoryId)).all()
  if (!category) {
    throw new Response("Not Found", {
      status: 404,
    });
  }
  return { category: category, image: image }
}

export default function CategorySlug() {
  const data = useLoaderData<typeof loader>();
  const categoryName = data.category[0].name
  console.log(data)
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
    <h1>{ categoryName } に関連する画像一覧</h1>
    <ul>
      <li><a href="/">TOPページ</a></li>
      <li><a href="/categories">カテゴリー</a></li>
      <li><a href="/tags">タグ</a></li>
      <li><a href="/images">画像投稿</a></li>
    </ul>
    {data.image.length ? (
         <ul>
           {data.image.map((i) => (
             <li key={i.id}>
               <span>{i.id}.</span><a href={`/images/${i.id}`}>{i.name}</a>
               <div>{i.key}</div>
             </li>
           ))}
         </ul>
       ) : (
         <p>関連する画像はまだありません。</p>
       )}
  </div>
  );
}