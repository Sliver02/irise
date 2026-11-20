export interface NewsletterTemplateProps {
	email: string;
	locale: string;
}

const NewsletterTemplate: React.FC<Readonly<NewsletterTemplateProps>> = ({ email, locale }) => (
	<div>
		<h1>New newsletter subscription</h1>
		<p>
			<strong>Email:</strong> {email}
			<br />
			<strong>Language:</strong> {locale}
		</p>
	</div>
);

export default NewsletterTemplate;
