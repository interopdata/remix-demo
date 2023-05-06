import type { ActionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { stringify } from "csv-stringify/sync";
import { Interopdata } from "interopdata";

import { getNotes } from "~/models/note.server";

export async function action({ request }: ActionArgs) {
  const interopdata = new Interopdata(process.env.INTEROPDATA_SECRET_KEY!, {
    basePath: process.env.INTEROPDATA_API_HOST,
  });

  const signature = request.headers.get("interopdata-signature");
  if (!signature) {
    return json(
      {
        error: "bad request",
      },
      { status: 400 }
    );
  }

  const body = interopdata.webhooks.constructEvent(
    Buffer.from(await (await request.blob()).arrayBuffer()),
    signature,
    process.env.INTEROPDATA_WEBHOOK_SECRET!
  );

  if (body.dataset === "notes") {
    const notes = await getNotes({
      userId: body.customerId,
    });

    const csv = stringify(
      notes.map((note) => [
        note.id,
        note.title,
        note.body,
        note.createdAt.toISOString(),
        note.updatedAt.toISOString(),
      ]),
      {
        header: true,
        columns: ["id", "title", "body", "created_at", "updated_at"],
      }
    );

    await fetch(body.uploadURL, {
      method: "PUT",
      body: csv,
    });
  }

  return json({
    ok: true,
  });
}
