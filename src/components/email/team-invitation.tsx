interface TeamInvitationEmailProps {
  teamName: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: Date;
}

export function TeamInvitationEmail({
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
