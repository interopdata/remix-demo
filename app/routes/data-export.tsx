import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Interopdata } from "interopdata";

import { requireUser } from "~/session.server";

export async function loader({ request }: ActionArgs) {
  const user = await requireUser(request);

  const interopdata = new Interopdata(process.env.INTEROPDATA_SECRET_KEY!, {
    basePath: process.env.INTEROPDATA_API_HOST,
  });

  const dataExportLink = await interopdata.dataExportLinks.create({
    customer: {
      id: user.id,
      email: user.email,
    },
  });

  return redirect(dataExportLink.url);
}
