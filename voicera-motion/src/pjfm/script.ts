export type Who = 'user' | 'bot';

export type Line = {
  id: string;
  who: Who;
  text: string;
  kind?: 'card' | 'closing';
};

export const CARD = {
  name: 'Albert Joseph',
  contact: '+919876543210',
  purpose: 'Baptism',
};

export const LINES: Line[] = [
  {
    id: 'w',
    who: 'bot',
    text: 'Welcome to The Glorious Church! How may I assist you today?',
  },
  {id: 'u1', who: 'user', text: 'What are your church service timings?'},
  {
    id: 'b1',
    who: 'bot',
    text: "Our services include Thursday's Forensic Night at 6:00 PM IST, Sunday services at 7:30 AM and 11:30 AM IST, and services on Poya Days at 10:00 AM IST. The service languages vary by schedule. Is there anything else you'd like to know?",
  },
  {id: 'u2', who: 'user', text: 'Where is the Miracle Dome located?'},
  {
    id: 'b2',
    who: 'bot',
    text: 'The Miracle Dome is located on Katunayake-Veyangoda Road, Katunayake, Sri Lanka. Would you like to know anything else about the church?',
  },
  {id: 'u3', who: 'user', text: 'Do you have an English service?'},
  {
    id: 'b3',
    who: 'bot',
    text: 'Yes. Our Sunday service at 11:30 AM IST includes English and Sinhala. How else may I help you?',
  },
  {id: 'u4', who: 'user', text: 'How can I contact the church?'},
  {
    id: 'b4',
    who: 'bot',
    text: 'You can contact the church by email at info@prophetjerome.com or via WhatsApp at +94 71 644 4999. Is there anything else I can help with?',
  },
  {id: 'u5', who: 'user', text: 'Do you have a special service every month?'},
  {
    id: 'b5',
    who: 'bot',
    text: 'Yes. The first Sunday of each month features Big Church Sunday at 7:30 AM IST, in Tamil. Is there anything else you\'d like to know?',
  },
  {id: 'u6', who: 'user', text: 'I would like to register for baptism.'},
  {id: 'b6', who: 'bot', text: 'Certainly. May I have your full name, please?'},
  {id: 'u7', who: 'user', text: 'My name is Albert Joseph.'},
  {
    id: 'b7',
    who: 'bot',
    text: 'Thank you, Albert Joseph. Could you please share your contact number or email address?',
  },
  {id: 'u8', who: 'user', text: '+919876543210.'},
  {
    id: 'b8',
    who: 'bot',
    text: 'Thank you. Could you briefly tell me the purpose of your registration?',
  },
  {id: 'u9', who: 'user', text: 'I would like to register for baptism.'},
  {id: 'b9', who: 'bot', text: 'Thank you. Let me confirm your details.'},
  {id: 'card', who: 'bot', text: '', kind: 'card'},
  {id: 'u10', who: 'user', text: 'Yes, these details are correct.'},
  {
    id: 'b10',
    who: 'bot',
    kind: 'closing',
    text: 'Thank you for confirming your details. I have noted your registration, and a member of our team will follow up with you using the contact information you provided. Thank you for reaching out to The Glorious Church.',
  },
];
