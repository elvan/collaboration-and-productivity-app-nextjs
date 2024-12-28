import { Resend } from 'resend';
import { TeamInvitation, User, Team } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInvitationEmailParams {
  invitation: TeamInvitation & {
    team: Team;
    invitedBy: User;
  };
  inviteUrl: string;
}

export async function sendTeamInvitationEmail({
  invitation,
  inviteUrl,
}: SendInvitationEmailParams) {
  const { email, team, invitedBy } = invitation;

  try {
    const { data, error } = await resend.emails.send({
      from: 'CollabSpace <notifications@collabspace.app>',
      to: email,
      subject: `Join ${team.name} on CollabSpace`,
      react: TeamInvitationEmail({
        teamName: team.name,
        inviterName: invitedBy.name || 'A team member',
        inviteUrl,
        expiresAt: invitation.expiresAt,
      }),
    });

    if (error) {
      console.error('[TEAM_INVITATION_EMAIL_ERROR]', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[TEAM_INVITATION_EMAIL_ERROR]', error);
    throw error;
  }
}

interface TeamInvitationEmailProps {
  teamName: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: Date;
}

function TeamInvitationEmail({
  teamName,
  inviterName,
  inviteUrl,
  expiresAt,
}: TeamInvitationEmailProps) {
  return (
    <div>
      <h1>Join {teamName} on CollabSpace</h1>
      <p>{inviterName} has invited you to join their team on CollabSpace.</p>
      <div>
        <a
          href={inviteUrl}
          style={{
            backgroundColor: '#0070f3',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            display: 'inline-block',
            marginTop: '16px',
            marginBottom: '16px',
          }}
        >
          Accept Invitation
        </a>
      </div>
      <p>
        This invitation will expire on{' '}
        {new Date(expiresAt).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <p>
        If you don't have a CollabSpace account, you'll be able to create one when
        you accept the invitation.
      </p>
    </div>
  );
}
