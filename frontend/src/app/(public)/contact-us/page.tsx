'use client';

import { useState } from 'react';
import styles from './page.module.css';
import { FaPaperPlane, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(formData);
      alert('Your message has been sent successfully!');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.contactContainer}>
      <div className={styles.contactHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Get in Touch</h1>
          <p className={styles.heroSubtitle}>
            Have questions or want to discuss a project? We'd love to hear from you.
          </p>
        </div>
      </div>

      <div className={styles.contactContent}>
        <div className={styles.contactInfoWrapper}>
          <div className={styles.contactInfoCard}>
            <h2 className={styles.contactInfoTitle}>Contact Information</h2>
            <p className={styles.contactInfoText}>
              Feel free to reach out through any of these channels
            </p>

            <div className={styles.contactMethods}>
              <div className={styles.contactMethod}>
                <div className={styles.methodIcon}>
                  <FaEnvelope />
                </div>
                <div>
                  <h3 className={styles.methodTitle}>Email Us</h3>
                  <a href="mailto:spellhire@gmail.com" className={styles.methodLink}>
                    spellhire@gmail.com
                  </a>
                </div>
              </div>

              <div className={styles.contactMethod}>
                <div className={styles.methodIcon}>
                  <FaPhoneAlt />
                </div>
                <div>
                  <h3 className={styles.methodTitle}>Call Us</h3>
                  <a href="tel:+1234567890" className={styles.methodLink}>
                    +91 9876543210
                  </a>
                </div>
              </div>

              {/* <div className={styles.contactMethod}>
                <div className={styles.methodIcon}>
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <h3 className={styles.methodTitle}>Visit Us</h3>
                  <address className={styles.methodText}>
                    123 Business Avenue<br />
                    Tech City, TC 10001<br />
                    Country
                  </address>
                </div>
              </div> */}


            </div>
          </div>

          <div className={styles.contactImage}>
            <img
              src="/ghfjhgj/home_section2_image.png"
              alt="Contact Visual"
              className={styles.visualImage}
            />
          </div>
        </div>

        <div className={styles.contactFormWrapper}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Send Us a Message</h2>
            <form onSubmit={handleSubmit} className={styles.contactForm}>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.formLabel}>Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.formLabel}>Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="How can we help you?"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className={styles.formTextarea}
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  'Sending...'
                ) : (
                  <>
                    <FaPaperPlane className={styles.buttonIcon} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}