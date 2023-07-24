import type { V2_MetaFunction } from "@remix-run/cloudflare";
import { redirect } from '@remix-run/cloudflare';
import type { LoaderArgs, ActionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from "@remix-run/react";
import type { InferModel } from 'drizzle-orm';
import { createClient } from "~/db/client.server"
import { images, tags, imagesToTags } from '~/db/schema';
import { eq } from "drizzle-orm";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

type NewImagesToTags = InferModel<typeof imagesToTags, 'insert'>;
export async function action({ params, request, context }: ActionArgs) {
  const imageId = Number(params.slug)
  const formData = await request.formData();
  const tagId = Number(formData.get('tag'));
  const newImagesToTags: NewImagesToTags = {
    image_id: imageId,
    tag_id: tagId,
  }
  const db = createClient(context.env.DB as D1Database);
  await db.insert(imagesToTags).values(newImagesToTags).run();
  return redirect(`/images/${params.slug}`);
}

export const loader = async ({ params, context }: LoaderArgs) => {
  const db = createClient(context.env.DB as D1Database);
  const imageId = params.slug
  const image = await db.select().from(images).where(eq(images.id, imageId)).all()
  if (!image) {
    throw new Response("Not Found", {
      status: 404,
    });
  }
  return { image: image }
}

export default function TagSlug() {
  const data = useLoaderData<typeof loader>();
  const imageName = data.image[0].name
  console.log(data)
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>{ imageName }</h1>
      <ul>
				<li><a href="/">TOPページ</a></li>
				<li><a href="/categories">カテゴリー</a></li>
				<li><a href="/tags">タグ</a></li>
				<li><a href="/images">画像投稿</a></li>
    	</ul>
      <form method="post">
        <fieldset>
          <legend>{ imageName }の編集</legend>
          <img src={`https://pub-4129228c5de34ed7a5eb7e59e41f2eae.r2.dev/${data.image[0].key}`}></img>
          <div>
            <label htmlFor="tag">タグ</label>
            <input name="tag" type="text" required />
          </div>

          <button type="submit">更新</button>
        </fieldset>
      </form>
    </div>
  );
}
