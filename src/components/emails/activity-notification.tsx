import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import { Tailwind } from "@react-email/tailwind"

interface ActivityEmailProps {
  title: string
  message: string
  projectName: string
  projectUrl: string
  userEmail: string
}

export default function ActivityEmail({
  title,
  message,
  projectName,
  projectUrl,
  userEmail,
}: ActivityEmailProps) {
  const previewText = `${title} - ${message}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-5 px-4">
            <Heading className="text-2xl font-bold text-gray-900">
              {title}
            </Heading>
            <Text className="text-base text-gray-700">{message}</Text>
            <Section className="mt-6">
              <Button
                className="bg-primary text-white px-6 py-3 rounded-md font-medium"
                href={projectUrl}
              >
                View in Project
              </Button>
            </Section>
            <Hr className="my-6 border-gray-200" />
            <Text className="text-sm text-gray-500">
              You received this email because you are a member of {projectName}.
              You can manage your notification preferences in your account settings.
            </Text>
            <Link
              href="{unsubscribeUrl}"
              className="text-sm text-gray-500 underline"
            >
              Unsubscribe from these emails
            </Link>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
