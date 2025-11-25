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

export const error = ({ name, error }) => (



    <Html lang="en" dir="ltr">
        <Tailwind>
            <Head />
            <Body className="bg-gray-100 font-sans py-[40px]">
                <Container className="bg-white max-w-[500px] mx-auto p-[32px] rounded-[8px] shadow-lg">
                    <Section className="mb-[32px]">
                        <Heading className="text-[24px] font-semibold text-blue-900 mb-[8px]">
                            Download Error Report
                        </Heading>

                        <div className="w-full h-[1px] bg-blue-100 mb-[24px]"></div>

                        <Section className="space-y-[20px]">
                            <div className="bg-gray-50 p-[16px] rounded-[6px]">
                                <Text className="text-[14px] text-gray-600 mb-[4px] font-medium">
                                    Reported by
                                </Text>
                                <Text className="text-[16px] text-gray-900 mb-[0px] font-semibold">
                                    {name}
                                </Text>
                            </div>

                            <div className="bg-gray-50 p-[16px] rounded-[6px]">
                                <Text className="text-[14px] text-gray-600 mb-[4px] font-medium">
                                    Error Message
                                </Text>
                                <Text className="text-[16px] text-gray-900 mb-[0px] font-semibold">
                                    {error}
                                </Text>
                            </div>

                            <div className="bg-gray-50 p-[16px] rounded-[6px]">
                                <Text className="text-[14px] text-gray-600 mb-[4px] font-medium">
                                    Sunbmitted at
                                </Text>
                                <Text className="text-[16px] text-gray-900 mb-[0px] font-semibold">
                                    {new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
                                </Text>
                            </div>


                        </Section>


                    </Section>
                </Container>
            </Body>
        </Tailwind>
    </Html>
);

