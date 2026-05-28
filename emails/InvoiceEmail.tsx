import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface Photo {
  storageUrl: string;
  type: "before" | "after" | "detail";
}

interface InvoiceEmailProps {
  fromName: string;
  clientName?: string;
  description: string;
  amount: string;
  paymentUrl: string;
  jobId: string;
  photos?: Photo[];
}

export default function InvoiceEmail({
  fromName,
  clientName,
  description,
  amount,
  paymentUrl,
  jobId,
  photos = [],
}: InvoiceEmailProps) {
  const beforePhoto = photos.find((p) => p.type === "before");
  const afterPhoto = photos.find((p) => p.type === "after") ?? photos.find((p) => p.type === "detail");
  const hasPhotos = beforePhoto || afterPhoto;

  return (
    <Html>
      <Head />
      <Preview>
        Invoice from {fromName} — {amount} due. Pay securely online.
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>{fromName}</Text>
          </Section>

          {/* Hero */}
          <Section style={hero}>
            <Text style={greeting}>
              {clientName ? `Hi ${clientName},` : "Hi there,"}
            </Text>
            <Text style={heroSubtext}>
              You have an invoice for the following service:
            </Text>
            <Text style={serviceText}>{description}</Text>
          </Section>

          {/* Pay Now CTA */}
          <Section style={ctaSection}>
            <Button style={payButton} href={paymentUrl}>
              Pay {amount} Now
            </Button>
          </Section>

          {/* Before / After Photos */}
          {hasPhotos && (
            <Section style={photosSection}>
              <Row>
                {beforePhoto && (
                  <Column style={photoColumn}>
                    <Text style={photoLabel}>Before</Text>
                    <Img
                      src={beforePhoto.storageUrl}
                      alt="Before"
                      width="240"
                      style={photo}
                    />
                  </Column>
                )}
                {afterPhoto && (
                  <Column style={photoColumn}>
                    <Text style={photoLabel}>After</Text>
                    <Img
                      src={afterPhoto.storageUrl}
                      alt="After"
                      width="240"
                      style={photo}
                    />
                  </Column>
                )}
              </Row>
            </Section>
          )}

          <Hr style={divider} />

          {/* Invoice Details */}
          <Section style={detailsSection}>
            <Row>
              <Column>
                <Text style={detailLabel}>Amount Due</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={detailValue}>{amount}</Text>
              </Column>
            </Row>
            <Row>
              <Column>
                <Text style={detailLabel}>Invoice</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={detailValueMuted}>#{jobId.slice(0, 8).toUpperCase()}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Questions? Reply to this email and {fromName} will get back to you.
            </Text>
            <Text style={footerMuted}>Powered by SwiftJobs</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: "32px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  maxWidth: "560px",
  margin: "0 auto",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  backgroundColor: "#1d4ed8",
  padding: "20px 32px",
};

const headerText: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  margin: 0,
};

const hero: React.CSSProperties = {
  padding: "32px 32px 0",
};

const greeting: React.CSSProperties = {
  color: "#111827",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const heroSubtext: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "15px",
  margin: "0 0 12px",
};

const serviceText: React.CSSProperties = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: "500",
  margin: 0,
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "12px 16px",
  borderLeft: "3px solid #1d4ed8",
};

const ctaSection: React.CSSProperties = {
  padding: "28px 32px",
  textAlign: "center",
};

const payButton: React.CSSProperties = {
  backgroundColor: "#1d4ed8",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "18px",
  fontWeight: "700",
  padding: "16px 40px",
  textDecoration: "none",
  textAlign: "center",
  letterSpacing: "-0.01em",
};

const photosSection: React.CSSProperties = {
  padding: "0 32px 24px",
};

const photoColumn: React.CSSProperties = {
  width: "50%",
  paddingRight: "8px",
};

const photoLabel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  margin: "0 0 6px",
};

const photo: React.CSSProperties = {
  borderRadius: "8px",
  width: "100%",
  objectFit: "cover",
};

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "0 32px",
};

const detailsSection: React.CSSProperties = {
  padding: "16px 32px",
};

const detailLabel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "4px 0",
};

const detailValue: React.CSSProperties = {
  color: "#111827",
  fontSize: "14px",
  fontWeight: "700",
  margin: "4px 0",
  textAlign: "right",
};

const detailValueMuted: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "13px",
  margin: "4px 0",
  textAlign: "right",
  fontFamily: "monospace",
};

const footerSection: React.CSSProperties = {
  padding: "16px 32px 28px",
};

const footerText: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
  margin: "0 0 8px",
};

const footerMuted: React.CSSProperties = {
  color: "#d1d5db",
  fontSize: "12px",
  margin: 0,
};
