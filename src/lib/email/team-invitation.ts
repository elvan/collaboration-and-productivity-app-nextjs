import { Resend } from 'resend';
import { TeamInvitation, User, Team } from '@prisma/client';
import { TeamInvitationEmail } from '@/components/email/team-invitation';

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
