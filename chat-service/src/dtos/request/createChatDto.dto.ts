export interface CreateChatDto {
  participant1: string;
  participant2: string;
  participant2Name?: string;
  participant2ProfileUrl?: string;
  participant1Role: 'admin';
  participant2Role: 'user' | 'collector';
}
