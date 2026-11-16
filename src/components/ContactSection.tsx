import { FormEvent, useState } from 'react';
import { CheckCircle2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

interface ContactSectionProps {
  cafeName: string;
  locationLabel: string;
  phoneDisplay: string;
  whatsappNumber: string;
  email: string;
}

interface FormState {
  name: string;
  contact: string;
  dateAndTime: string;
  guests: string;
  message: string;
}

export function ContactSection({
  cafeName,
  locationLabel,
  phoneDisplay,
  whatsappNumber,
  email,
}: ContactSectionProps) {
  const [form, setForm] = useState<FormState>({
    name: '',
    contact: '',
    dateAndTime: '',
    guests: '2 guests',
    message: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<FormState | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!form.contact.trim()) {
      setError('Please enter an email address or WhatsApp number.');
      return;
    }
    if (!form.message.trim()) {
      setError('Please include your reservation details or question.');
      return;
    }
    setError(null);
    setSubmittedData({ ...form });
  };

  const buildWhatsAppInquiryUrl = (data: FormState) => {
    const text = [
      `Hello ${cafeName},`,
      `Name: ${data.name}`,
      `Contact: ${data.contact}`,
      `Party Size: ${data.guests}`,
      data.dateAndTime ? `Preferred Date/Time: ${data.dateAndTime}` : '',
      `Message: ${data.message}`,
    ]
      .filter(Boolean)
      .join('\n');
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  const buildMailtoUrl = (data: FormState) => {
    const subject = `${cafeName} Reservation / Inquiry from ${data.name}`;
    const body = [
      `Name: ${data.name}`,
      `Contact: ${data.contact}`,
      `Party Size: ${data.guests}`,
      data.dateAndTime ? `Preferred Date/Time: ${data.dateAndTime}` : '',
      '',
      data.message,
    ]
      .filter(Boolean)
      .join('\n');
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <section
      id="contact"
      className="py-16 sm:py-24 border-t"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--surface-muted) 55%, var(--canvas))',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mb-10">
          <p
            className="text-xs font-semibold tracking-wide mb-2"
            style={{ color: 'var(--warm-accent)' }}
          >
            07. Contact &amp; Reservations · වෙන්කරවා ගැනීම් සහ සම්බන්ධතා
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-balance"
            style={{ color: 'var(--text-primary)' }}
          >
            Reserve a veranda table or message our family kitchen
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Direct Contact Details */}
          <div className="lg:col-span-5 space-y-5">
            <div
              className="border rounded-xl p-6 space-y-5"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
              }}
            >
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Walk-ins are always welcome. For group Rice &amp; Curry lunches, sunrise tea tables, or takeaway roti packs before your train, reach out directly by WhatsApp or email.
              </p>

              <div
                className="space-y-4 pt-4 border-t"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <a
                  href={`tel:${phoneDisplay.replace(/\s+/g, '')}`}
                  className="flex items-start gap-3"
                >
                  <Phone
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: 'var(--accent)' }}
                  />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Phone &amp; WhatsApp
                    </p>
                    <p
                      className="text-sm font-medium font-mono-tabular"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {phoneDisplay}
                    </p>
                  </div>
                </a>

                <a href={`mailto:${email}`} className="flex items-start gap-3">
                  <Mail
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: 'var(--accent)' }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Email
                    </p>
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {email}
                    </p>
                  </div>
                </a>

                <div className="flex items-start gap-3">
                  <MapPin
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: 'var(--accent)' }}
                  />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Village Address
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {locationLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 min-h-[44px] inline-flex items-center justify-center gap-2 text-sm font-medium text-white rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right: Validated Reservation & Inquiry Form */}
          <div
            className="lg:col-span-7 border rounded-xl p-6 sm:p-8"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            {submittedData ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-6 h-6 shrink-0 mt-0.5"
                    style={{ color: 'var(--accent)' }}
                  />
                  <div>
                    <h3
                      className="font-display text-2xl font-medium mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Reservation Request Ready
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Thank you, {submittedData.name}. Send your request straight to our team in Ella via WhatsApp or Email:
                    </p>
                  </div>
                </div>

                <div
                  className="border rounded-lg p-4 text-sm space-y-1.5"
                  style={{
                    backgroundColor: 'var(--canvas)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <p>
                    <span style={{ color: 'var(--text-muted)' }}>Contact:</span>{' '}
                    {submittedData.contact}
                  </p>
                  <p>
                    <span style={{ color: 'var(--text-muted)' }}>Party Size:</span>{' '}
                    {submittedData.guests}
                  </p>
                  {submittedData.dateAndTime && (
                    <p>
                      <span style={{ color: 'var(--text-muted)' }}>Preferred Time:</span>{' '}
                      {submittedData.dateAndTime}
                    </p>
                  )}
                  <p className="pt-1" style={{ color: 'var(--text-primary)' }}>
                    {submittedData.message}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={buildWhatsAppInquiryUrl(submittedData)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] text-sm font-medium text-white rounded-lg transition-colors whitespace-nowrap"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send via WhatsApp</span>
                  </a>
                  <a
                    href={buildMailtoUrl(submittedData)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--surface-muted)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Open in Email</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedData(null);
                      setForm({
                        name: '',
                        contact: '',
                        dateAndTime: '',
                        guests: '2 guests',
                        message: '',
                      });
                    }}
                    className="text-xs font-medium underline ml-auto cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Make another request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <h3
                    className="font-display text-2xl font-medium mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Table Reservation or Inquiry
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Let us know when you plan to visit or if you would like traditional Rice &amp; Curry prepared fresh for your group.
                  </p>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="text-xs font-medium text-[#9B2C2C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3.5 py-2.5"
                  >
                    {error}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Nimal Jayasinghe"
                      className="w-full px-3.5 py-2.5 min-h-[42px] text-sm border rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-info"
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      WhatsApp or Email
                    </label>
                    <input
                      id="contact-info"
                      type="text"
                      required
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      placeholder="+94 77 ... or email"
                      className="w-full px-3.5 py-2.5 min-h-[42px] text-sm border rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-datetime"
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Preferred Date &amp; Time (Optional)
                    </label>
                    <input
                      id="contact-datetime"
                      type="text"
                      value={form.dateAndTime}
                      onChange={(e) => setForm({ ...form, dateAndTime: e.target.value })}
                      placeholder="e.g. Tomorrow · 09:00 AM"
                      className="w-full px-3.5 py-2.5 min-h-[42px] text-sm border rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-guests"
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Party Size
                    </label>
                    <select
                      id="contact-guests"
                      value={form.guests}
                      onChange={(e) => setForm({ ...form, guests: e.target.value })}
                      className="w-full px-3.5 py-2.5 min-h-[42px] text-sm border rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--canvas)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="1 guest">1 guest</option>
                      <option value="2 guests">2 guests</option>
                      <option value="3–4 guests">3–4 guests</option>
                      <option value="5+ guests">5+ guests</option>
                      <option value="General question">General question</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Reservation Notes or Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us what you'd like to eat, terrace seating preferences, or any questions..."
                    className="w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none"
                    style={{
                      backgroundColor: 'var(--canvas)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-5 min-h-[44px] text-sm font-medium text-white rounded-lg transition-colors cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Prepare Reservation Request
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
