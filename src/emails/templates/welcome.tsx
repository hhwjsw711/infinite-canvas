import { Footer } from "../components/footer";
import { Logo } from "../components/logo";
import { OutlineButton } from "../components/outline-button";
import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function WelcomeEmail({ name = "there" }: { name: string }) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Geist Mono"
          fallbackFontFamily="Verdana"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@500&display=swap",
            format: "woff2",
          }}
          fontWeight={500}
          fontStyle="normal"
        />
      </Head>
      <Preview>Welcome to Infinite Canvas! Let's get started.</Preview>
      <Tailwind>
        <Body className="bg-white font-mono">
          <Container className="mx-auto py-5 pb-12 max-w-[580px]">
            <Logo />

            <Text className="text-sm leading-7 mb-6 font-mono">
              Hi {name}, welcome to Infinite Canvas!
            </Text>

            <Text className="text-sm leading-7 pb-2 font-mono">
              We're excited to help you create without limits. Here's what you
              can do with Infinite Canvas:
            </Text>

            <Text className="text-sm font-mono">
              <span className="text-lg">◇ </span>
              Create with no limits — an infinite space for ideas
            </Text>
            <Text className="text-sm font-mono">
              <span className="text-lg">◇ </span>
              Generate images and videos with AI, right on the canvas
            </Text>
            <Text className="text-sm font-mono">
              <span className="text-lg">◇ </span>
              Store your creations seamlessly — the canvas never runs out
            </Text>
            <Text className="text-sm font-mono">
              <span className="text-lg">◇ </span>
              Collaborate with your team in real-time
            </Text>
            <Text className="text-sm font-mono">
              <span className="text-lg">◇ </span>
              The canvas your whiteboard wishes it was 😉
            </Text>

            <Section className="mb-20 mt-8">
              <OutlineButton
                className="mr-6"
                variant="default"
                href="https://infinite-canvas.com"
              >
                Start Creating
              </OutlineButton>
            </Section>

            <Section className="mt-8">
              <Text className="text-sm leading-7 mb-6 font-mono text-[#707070]">
                If you have any questions, feel free to reach out to us at{" "}
                <Link
                  href="mailto:support@infinite-canvas.com"
                  className="underline text-black font-mono"
                >
                  support@infinite-canvas.com
                </Link>
              </Text>
            </Section>

            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
