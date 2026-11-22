// EmailJS fallback only (no NEXT_PUBLIC_NEWSLETTER_URL). With the Apps Script set up, the
// script writes every email itself: see apps-script/newsletter.gs.

export interface NewsletterTemplateProps {
	email: string;
	locale: string;
}

/** To smup.yoga@gmail.com. Always Italian: it's for us. */
const NewsletterTemplate: React.FC<Readonly<NewsletterTemplateProps>> = ({ email, locale }) => (
	<div>
		<h1>Nuova iscrizione alla newsletter</h1>
		<p>
			<strong>Email:</strong> {email}
			<br />
			<strong>Lingua:</strong> {locale}
		</p>
		<p>Aggiungila a mano alla lista: l&apos;Apps Script della newsletter non è ancora attivo.</p>
	</div>
);

export interface NewsletterConfirmationProps {
	title: string;
	body: string;
	unsubscribe: string;
	signoff: string;
}

/** To the subscriber, in the locale they signed up from. */
export const NewsletterConfirmation: React.FC<Readonly<NewsletterConfirmationProps>> = ({
	title,
	body,
	unsubscribe,
	signoff,
}) => (
	<div>
		<h1>{title}</h1>
		<p>{body}</p>
		<p>{unsubscribe}</p>
		<p>{signoff}</p>
	</div>
);

export default NewsletterTemplate;
