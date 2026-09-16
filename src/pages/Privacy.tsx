import { Link } from 'react-router-dom';
import LegalPage, { LegalSection, CONTACT_EMAIL } from '../components/LegalPage';

const LAST_UPDATED = '16 September 2026';

const li = { marginBottom: '6px' };
const ul = { paddingLeft: '20px', listStyle: 'disc', marginTop: '8px', marginBottom: '8px' };
const link = { color: 'var(--accent-ink)' };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated={LAST_UPDATED}>
      <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-muted)', marginBottom: '32px' }}>
        Aevon is a record of your aquatics career. Most of the people on it are under 18, so we have
        written this in plain language rather than legal language, and we have kept what we collect
        to what the platform actually needs. This policy explains what we hold, why, and what you can
        ask us to do about it.
      </p>

      <LegalSection heading="What we collect">
        <p>When you create an account we ask for:</p>
        <ul style={ul}>
          <li style={li}><strong>Your name</strong> — shown on your profile and on rankings.</li>
          <li style={li}><strong>Your email address and password</strong> — to sign you in.</li>
          <li style={li}><strong>Your state</strong> — shown on your profile and used to filter rankings.</li>
          <li style={li}>
            <strong>Your date of birth</strong>, if you are an athlete — used to place you in the
            right age group. We never show it to anyone. Other people only ever see your age group,
            such as "13–14 Years".
          </li>
          <li style={li}><strong>Your discipline, events and gender</strong> — rankings are organised by these.</li>
          <li style={li}>
            <strong>A parent or guardian's name and email</strong>, if you are under 18. We hold this
            so a guardian knows the account exists and can contact us about it. It is never shown to
            other users.
          </li>
        </ul>

        <p style={{ marginTop: '14px' }}>Afterwards you may choose to add:</p>
        <ul style={ul}>
          <li style={li}><strong>A profile photo and a banner image.</strong></li>
          <li style={li}><strong>Video of you training or competing.</strong></li>
          <li style={li}><strong>Your times, scores and competition results</strong>, and the meets they came from.</li>
          <li style={li}><strong>Your club, your city, and a short bio.</strong></li>
          <li style={li}>
            <strong>A phone number.</strong> This is optional and is used only to help you recover
            your account. It is never shown on your profile and no other user can see it.
          </li>
          <li style={li}><strong>Your SFI registration number</strong>, if you want your account verified.</li>
        </ul>

        <p style={{ marginTop: '14px' }}>
          We also record results imported from official meet sheets. If you have not signed up yet,
          this can mean a profile exists with your name and result on it before you do. You can claim
          that profile, or ask us to remove it — see <em>Your choices</em> below.
        </p>

        <p style={{ marginTop: '14px' }}>
          We keep basic technical records too, such as how many times your profile has been viewed.
          We do not sell your data, and we do not use it to serve advertising.
        </p>
      </LegalSection>

      <LegalSection heading="How we use it">
        <ul style={ul}>
          <li style={li}>To show your profile, results and film to the people you have chosen to show them to.</li>
          <li style={li}>To rank you against other athletes in your discipline, age group, gender and state.</li>
          <li style={li}>To let coaches, clubs and brands find athletes, within the limits you set.</li>
          <li style={li}>To verify that you are who you say you are, using your SFI registration.</li>
          <li style={li}>To keep the platform safe — for example, acting on a report or a block.</li>
          <li style={li}>To contact you about your account.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Who can see your profile">
        <p>
          Your profile has two settings, and you choose between them in{' '}
          <Link to="/profile/edit" style={link} className="hover:underline">your profile settings</Link>:
        </p>
        <ul style={ul}>
          <li style={li}>
            <strong>Public</strong> — your name, discipline, state, club, city, results, achievements
            and verification badge are visible to anyone, including people who are not signed in.
          </li>
          <li style={li}>
            <strong>Limited</strong> — the same, except your city is not shown.
          </li>
        </ul>
        <p style={{ marginTop: '10px' }}>
          Your date of birth is never shown on either setting, and neither is your phone number, your
          email address, or your guardian's details.
        </p>
        <p style={{ marginTop: '10px' }}>
          You also choose who can message you: anyone, only verified coaches and clubs, or nobody.
        </p>
        <p style={{ marginTop: '10px' }}>
          <strong>If you are under 18</strong>, your account starts on the limited setting with
          messages restricted to verified coaches and clubs. You can make your account more private
          than that at any time, but not less, until you turn 18.
        </p>
      </LegalSection>

      <LegalSection heading="If you are under 18">
        <p>
          Indian competitive swimming is mostly made up of 10 to 17 year olds, so this is the normal
          case rather than the exception.
        </p>
        <ul style={ul}>
          <li style={li}>
            You need a parent or guardian's permission. When you sign up we ask for their name and
            email address, and we record that consent was given.
          </li>
          <li style={li}>Your profile starts limited, and only verified coaches and clubs can message you.</li>
          <li style={li}>We never show your date of birth, your city, or any contact detail.</li>
          <li style={li}>
            A parent or guardian can contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={link} className="hover:underline">{CONTACT_EMAIL}</a>{' '}
            to see what we hold, change the settings, or have the account deleted. We will act on a
            guardian's request the same way we act on the athlete's own.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Your choices">
        <ul style={ul}>
          <li style={li}>
            <strong>See and correct your data.</strong> Almost everything we hold is editable in your
            profile settings. For anything that is not, write to us.
          </li>
          <li style={li}>
            <strong>Delete your account.</strong> There is a "Delete my account" action at the bottom
            of your profile settings. It removes your profile, results, film, messages and uploaded
            files. It cannot be undone. You can also ask us to do it by email.
          </li>
          <li style={li}>
            <strong>Block and report.</strong> Every profile and message thread has a menu to report
            someone or block them. Blocking is silent — the other person is not told.
          </li>
          <li style={li}>
            <strong>Withdraw consent.</strong> You, or your parent or guardian, can withdraw consent
            at any time. In practice this means deleting the account.
          </li>
        </ul>
        <p style={{ marginTop: '10px' }}>
          Some records may survive deletion where we are required to keep them — for example, an
          official meet result that forms part of the public competition record, or a safety report
          we are still acting on. We will tell you if that applies to you.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights under Indian law">
        <p>
          We handle personal data in line with India's{' '}
          <strong>Digital Personal Data Protection Act, 2023</strong> (the DPDP Act). Under that Act
          you have the right to know what personal data we hold about you and how we have used it,
          the right to have it corrected or completed, the right to have it erased, the right to
          nominate someone to exercise these rights on your behalf, and the right to complain.
        </p>
        <p style={{ marginTop: '10px' }}>
          The DPDP Act treats anyone under 18 as a child and requires verifiable consent from a
          parent or guardian before their data is processed. It also prohibits tracking children,
          serving them targeted advertising, and processing their data in ways likely to harm them.
          We do none of those things.
        </p>
        <p style={{ marginTop: '10px' }}>
          If you are not satisfied with how we have handled a request, you may complain to the Data
          Protection Board of India.
        </p>
      </LegalSection>

      <LegalSection heading="Keeping it safe">
        <p>
          Your data is stored with Supabase, which hosts our database and files. Access is restricted
          at the database level, not just in the app: your date of birth, phone number and guardian's
          details cannot be read by another user even by querying our systems directly. Passwords are
          hashed and we never see them.
        </p>
        <p style={{ marginTop: '10px' }}>
          No system is perfect. If a breach affects your data we will tell you and the Data Protection
          Board, as the DPDP Act requires.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          If we change this policy we will update the date at the top and, where the change is
          significant, tell you in the app or by email.
        </p>
      </LegalSection>

      <LegalSection heading="Contact us">
        <p>
          Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} style={link} className="hover:underline">{CONTACT_EMAIL}</a>.
          Tell us your username and what you would like us to do. We aim to reply within seven days,
          and to complete data requests within thirty.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
