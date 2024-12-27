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

interface ActivityDigestProps {
  userName: string
  digestType: "daily" | "weekly"
  activities: {
    projectName: string
    projectUrl: string
    items: {
      title: string
      message: string
      timestamp: string
    }[]
  }[]
  userEmail: string
  startDate: string
  endDate: string
}

export default function ActivityDigest({
  userName,
  digestType,
  activities,
  userEmail,
  startDate,
  endDate,
}: ActivityDigestProps) {
  const title = `Your ${digestType} project activity digest`
  const previewText = `${title} for ${startDate} - ${endDate}`

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
            <Text className="text-base text-gray-700">
              Hi {userName},
              <br />
              Here's a summary of what happened in your projects
              {digestType === "daily" ? " today" : " this week"}.
            </Text>

            {activities.map((project) => (
              <Section
                key={project.projectUrl}
                className="mt-8 bg-gray-50 rounded-lg p-4"
              >
                <Heading className="text-xl font-semibold text-gray-900">
                  {project.projectName}
                </Heading>
                <div className="space-y-4 mt-4">
                  {project.items.map((item, index) => (
                    <div key={index} className="bg-white rounded p-3">
                      <Text className="text-sm font-medium text-gray-900 m-0">
                        {item.title}
                      </Text>
                      <Text className="text-sm text-gray-700 mt-1 mb-1">
                        {item.message}
                      </Text>
                      <Text className="text-xs text-gray-500 m-0">
                        {item.timestamp}
                      </Text>
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-4 bg-primary text-white px-6 py-3 rounded-md font-medium"
                  href={project.projectUrl}
                >
                  View Project
                </Button>
              </Section>
            ))}

            <Hr className="my-6 border-gray-200" />
            <Text className="text-sm text-gray-500">
              You received this digest because you have subscribed to{" "}
              {digestType === "daily" ? "daily" : "weekly"} updates. You can
              manage your notification preferences in your account settings.
            </Text>
            <Link
              href="{unsubscribeUrl}"
              className="text-sm text-gray-500 underline"
            >
              Unsubscribe from digests
            </Link>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
