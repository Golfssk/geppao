alter table public.leads
  add column if not exists contact_email text,
  add column if not exists message text;

alter table public.leads
  add constraint leads_contact_name_length check (contact_name is null or char_length(contact_name) between 2 and 100),
  add constraint leads_contact_email_length check (contact_email is null or char_length(contact_email) <= 320),
  add constraint leads_contact_phone_length check (contact_phone is null or char_length(contact_phone) between 8 and 30),
  add constraint leads_message_length check (message is null or char_length(message) between 10 and 3000);

comment on column public.leads.contact_email is 'Email supplied through a lead or contact form.';
comment on column public.leads.message is 'Contact request details supplied by the visitor.';
