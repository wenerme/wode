import { getBuildInfo } from '../../../buildinfo';

export async function GET() {
  return Response.json(getBuildInfo());
}
