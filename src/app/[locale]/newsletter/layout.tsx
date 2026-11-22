import { RouteEnum } from "@/common/routeEnum";
import { pageMeta } from "@/common/seo";

export const generateMetadata = pageMeta(RouteEnum.NEWSLETTER_PAGE);

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
}
