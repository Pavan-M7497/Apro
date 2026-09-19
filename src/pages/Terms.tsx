import { Link } from 'react-router-dom';
import LegalPage, { LegalSection, CONTACT_EMAIL } from '../components/LegalPage';

const LAST_UPDATED = '16 September 2026';

const li = { marginBottom: '6px' };
const ul = { paddingLeft: '20px', listStyle: 'disc', marginTop: '8px', marginBottom: '8px' };
const link = { color: 'var(--accent-ink)' };

export default function Terms() {
  return (
    <LegalPage title="Terms of Use" updated={LAST_UPDATED}>
      <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)', marginBottom: '32px' }}>
        These are the rules for using Aevon. We have written them in plain language so that a
        fourteen-year-old swimmer and their parent can both read them without a lawyer. Using Aevon
        means you agree to them.
      </p>

      <LegalSection heading="Who can use Aevon">
        <ul style={ul}>
          <li style={li}>
            Aevon is for athletes, coaches, clubs and brands in Indian aquatics — swimming, water polo
            and diving.
          </li>
          <li style={li}>
            <strong>If you are under 18</strong>, you need a parent or guardian's permission, and we
            ask for their name and email when you sign up. If you do not have their permission,
            please do not create an account.
          </li>
          <li style={li}>One account per person. Do not create an account for someone else.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Your account">
        <ul style={ul}>
          <li style={li}>Keep your password to yourself. Tell us if you think someone else has it.</li>
          <li style={li}>Give us accurate information, especially your name and date of birth. Age groups and rankings depend on it.</li>
          <li style={li}>You are responsible for what happens on your account.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="What you post">
        <p>
          Your photos, video, results and bio stay yours. By posting them you give us permission to
          display them on Aevon, according to the privacy setting you have chosen. Nothing more — we
          do not sell your content or license it to anyone else.
        </p>
        <p style={{ marginTop: '10px' }}>Do not post:</p>
        <ul style={ul}>
          <li style={li}>Anything that is not yours to post, including film someone else shot without their agreement.</li>
          <li style={li}>Results you did not swim, dive or play. Faking results gets an account removed.</li>
          <li style={li}>Photos or video of other people's children without their parent's agreement.</li>
          <li style={li}>Anything sexual, violent, hateful, or intended to harass or humiliate someone.</li>
          <li style={li}>Anyone's contact details, including your own. Aevon does not display phone numbers.</li>
        </ul>
        <p style={{ marginTop: '10px' }}>
          We can remove content that breaks these rules, and we can suspend or remove an account that
          keeps breaking them.
        </p>
      </LegalSection>

      <LegalSection heading="Contacting other people">
        <p>
          Coaches, clubs and brands can message athletes, but only within the limits the athlete has
          set. Under-18 accounts only accept messages from verified coaches and clubs unless they
          have chosen otherwise.
        </p>
        <p style={{ marginTop: '10px' }}>
          If you are an adult messaging a young athlete, keep it about sport. Asking a minor for
          personal contact details, photographs, or to move the conversation to another platform is
          not allowed and will cost you your account. We report credible safeguarding concerns to the
          appropriate authorities.
        </p>
        <p style={{ marginTop: '10px' }}>
          Every profile and message thread has a menu to <strong>report</strong> or <strong>block</strong>{' '}
          someone. Use it. Blocking is silent and the other person is not told.
        </p>
      </LegalSection>

      <LegalSection heading="Verification and rankings">
        <ul style={ul}>
          <li style={li}>
            Verification tiers are based on your SFI registration and on results matched from
            official meets. A tier is a statement about what we have checked, not an endorsement.
          </li>
          <li style={li}>
            Rankings are calculated from the results on the platform. We correct them when we find an
            error, and we can remove results we believe are false.
          </li>
          <li style={li}>
            We import results from official meet sheets. This can create a profile carrying your name
            and result before you sign up. You can claim it by proving who you are, or ask us to
            remove it.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Your data">
        <p>
          What we collect and what you can ask us to do about it is set out in our{' '}
          <Link to="/privacy" style={link} className="hover:underline">Privacy Policy</Link>. In
          short: we collect what the platform needs, we never show your date of birth or contact
          details to other users, under-18 accounts are private by default, and you can delete your
          account at any time from your profile settings.
        </p>
        <p style={{ marginTop: '10px' }}>
          We handle personal data in line with India's Digital Personal Data Protection Act, 2023.
        </p>
      </LegalSection>

      <LegalSection heading="Ending your account">
        <ul style={ul}>
          <li style={li}>
            You can delete your account whenever you want, from the bottom of your profile settings.
            It removes your profile, results, film and messages, and cannot be undone.
          </li>
          <li style={li}>
            A parent or guardian can ask us to delete a minor's account by writing to{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={link} className="hover:underline">{CONTACT_EMAIL}</a>.
          </li>
          <li style={li}>
            We can suspend or remove an account that breaks these terms, or that puts someone at risk.
            Where we can, we will tell you why.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="What we do not promise">
        <p>
          Aevon is provided as it is. We work to keep it accurate and available, but we cannot promise
          it will never be wrong or never go down. We are not responsible for what other users do,
          for selection decisions a coach or selector makes, or for any opportunity you did or did
          not get. Nothing here limits any right you have under Indian law that cannot be limited.
        </p>
      </LegalSection>

      <LegalSection heading="Changes and governing law">
        <p>
          If we change these terms we will update the date at the top and tell you in the app when
          the change is significant. These terms are governed by the laws of India.
        </p>
      </LegalSection>

      <LegalSection heading="Contact us">
        <p>
          Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={link} className="hover:underline">{CONTACT_EMAIL}</a>{' '}
          with any question about these terms, your account, or a safety concern.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
