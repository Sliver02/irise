import { NewsletterManage } from "@/components/sections/Newsletter";

// Reached from the links in our emails: /newsletter?action=confirm|unsubscribe&token=…
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ action?: string; token?: string }>;
}) {
	const { action, token } = await searchParams;
	return <NewsletterManage action={action} token={token} />;
}
