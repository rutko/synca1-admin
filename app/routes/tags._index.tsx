import type { V2_MetaFunction } from "@remix-run/cloudflare";
import { redirect } from '@remix-run/cloudflare';
import type { LoaderArgs, ActionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from "@remix-run/react";
import type { InferModel } from 'drizzle-orm';
import { createClient } from "~/db/client.server"
import { tags } from '~/db/schema';
import { desc } from "drizzle-orm";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

type NewTags = InferModel<typeof tags, 'insert'>;
export async function action({request, context}: ActionArgs) {
  const formData = await request.formData();
  const name = formData.get('name') as string;
  const newTags: NewTags = {
    name: name,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const db = createClient(context.DB as D1Database);
  await db.insert(tags).values(newTags).run();
  return redirect(`/tags`);
}

export const loader = async ({ context }: LoaderArgs) => {
  const db = createClient(context.DB as D1Database);
  const allTags = await db.select().from(tags).orderBy(desc(tags.createdAt)).all()
  if (!allTags) {
    throw new Response("Not Found", {
      status: 404,
    });
  }
  return { tags: allTags }
}

export type Tags = InferModel<typeof tags>;
export default function Tags() {
  const data = useLoaderData<typeof loader>();
  console.log(data)
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Synca1 Admin</h1>
      <form method="post" action="/tags">
        <fieldset>
          <legend>タグの作成</legend>
          <div>
            <label htmlFor="name">タグ名</label>
            <input name="name" type="text" required />
          </div>

          <button type="submit">作成</button>
        </fieldset>
      </form>
      {data.tags.length ? (
         <ol reversed>
           {data.tags.map((t) => (
             <li key={t.id}>
               <a href={`/tags/${t.id}`}>{t.name}</a>
             </li>
           ))}
         </ol>
       ) : (
         <p>タグはまだ作成されていません</p>
       )}
    </div>
  );
}
