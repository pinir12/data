import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Tailwind,
} from '@react-email/components';

export const admin = ({ title, name, count = 1 }) => (
 

  
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white max-w-[500px] mx-auto p-[32px] rounded-[8px] shadow-lg">
            <Section className="mb-[32px]">
              <Heading className="text-[24px] font-semibold text-blue-900 mb-[8px]">
                Video Download
              </Heading>
              <Text className="text-[14px] text-gray-600 mb-[24px]">
                A video has been downloaded through your system.
              </Text>
              <div className="w-full h-[1px] bg-blue-100 mb-[24px]"></div>

              <Section className="space-y-[20px]">
                <div className="bg-gray-50 p-[16px] rounded-[6px]">
                  <Text className="text-[14px] text-gray-600 mb-[4px] font-medium">
                    Downloaded by
                  </Text>
                  <Text className="text-[16px] text-gray-900 mb-[0px] font-semibold">
    {name}
                  </Text>
                </div>

                <div className="bg-gray-50 p-[16px] rounded-[6px]">
                  <Text className="text-[14px] text-gray-600 mb-[4px] font-medium">
                    Video Title
                  </Text>
                  <Text className="text-[16px] text-gray-900 mb-[0px] font-semibold">
                    {title}
                  </Text>
                </div>

                <div className="bg-gray-50 p-[16px] rounded-[6px]">
                  <Text className="text-[14px] text-gray-600 mb-[4px] font-medium">
                    Download Time
                  </Text>
                  <Text className="text-[16px] text-gray-900 mb-[0px] font-semibold">
    {new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
                  </Text>
                </div>

                <div className="bg-gray-50 p-[16px] rounded-[6px]">
                  <Text className="text-[14px] text-gray-600 mb-[4px] font-medium">
                    Total Downloads by {name.split(" ")[0]}
                  </Text>
                  <Text className="text-[20px] text-gray-900 mb-[0px] font-bold">
                    {count}
                  </Text>
                </div>
              </Section>

              <Section className="mt-[24px] pt-[20px] border-t border-solid border-gray-200">
                <Text className="text-[12px] text-gray-500 text-center mb-[0px]">
                  This is an automated notification from your video downloading system.
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );

