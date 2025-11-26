import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Row,
  Column,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

export const videoDownloaded = ({ title, name, count = 1, thumbnailUrl = 'https://www.pinir.co.uk/assets/icon.jpg' }) => (
 
    <Html>
      <Head />
      <Preview>File Download Notification: {title}</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-[40px] bg-white p-[20px] rounded-md shadow-sm max-w-[600px]">
            <Section className="mb-[32px]">
              <Img
                src="https://www.pinir.co.uk/assets/header-image.jpg"
                alt="File Download"
                width="600"
                height="200"
                className="w-full h-auto rounded-md"
              />
            </Section>
            
            <Heading className="text-[24px] font-bold text-gray-800 mb-[16px]">
              Video Download Notification
            </Heading>
            
            <Text className="text-[16px] text-gray-700 mb-[24px]">
              Hello {name},
            </Text>
            
            <Text className="text-[16px] text-gray-700 mb-[16px]">
              We're letting you know that the following video was downloaded using your account:
            </Text>

            <Section className="bg-gray-50 p-[16px] rounded-md mb-[12px]">
              <Row>
                <Column style={{ width: '120px', paddingRight: '16px', verticalAlign: 'top' }}>
                  <div style={{ paddingTop: '4px' }}>
                    <Img
                      src={thumbnailUrl}
                      alt="Video Thumbnail"
                      width="120"
                      height="68"
                      className="w-[120px] h-auto rounded-md border border-gray-200"
                    />
                  </div>
                </Column>
                <Column style={{ verticalAlign: 'top' }}>
                  <Text className="text-[16px] text-gray-700 m-0">
                   {title}
                  </Text>
                </Column>
              </Row>
            </Section>
            
            <Text className="text-[12px] text-gray-500 mb-[32px] text-right">
              Downloaded on {new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
            </Text>
            
            
            
          
            
            
            <Text className="text-[16px] text-gray-700 mb-[24px]">
              This is video <strong>#{count}</strong> downloaded with your account.
            </Text>
            
            <Text className="text-[16px] text-gray-700 mb-[24px]">
              Thank you for using this service.
            </Text>
            
            
            <Section className="border-t border-gray-300 pt-[16px] text-[12px] text-gray-500">
              <Text className="m-0">
                ©  {new Date().getFullYear()} {' '}
                <Link 
                href="https://pinir.co.uk/" 
                className="underline"
              >
                
                PiniR
                </Link>. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );



