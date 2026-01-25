# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Brain Entrainer, please help us maintain the security of the project by reporting it responsibly.

**Please do NOT create a public GitHub issue for security vulnerabilities.**

### How to Report

1. **Email:** Send details to your-email@example.com (replace with your actual contact)
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Response Time:** We aim to respond within 48 hours
- **Updates:** We'll keep you informed of our progress
- **Credit:** We'll credit you for the discovery (unless you prefer to remain anonymous)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Security Best Practices

When deploying Brain Entrainer:

1. **Environment Variables:**
   - Never commit `.env` files
   - Use strong, unique SESSION_SECRET
   - Rotate API keys regularly

2. **Database:**
   - Use SSL connections in production
   - Implement regular backups
   - Follow principle of least privilege

3. **API Keys:**
   - Keep OpenAI API keys secure
   - Monitor usage for anomalies
   - Set spending limits

4. **Updates:**
   - Keep dependencies updated
   - Monitor security advisories
   - Run `npm audit` regularly

## Known Security Considerations

- This app processes audio in the browser - no audio data is stored server-side
- User sessions are stored in PostgreSQL with secure cookies
- OpenAI API calls are server-side only

## Vulnerability Disclosure Timeline

1. Initial report received
2. Confirmation and investigation (1-3 days)
3. Fix development and testing (varies)
4. Security patch release
5. Public disclosure (after fix is deployed)

Thank you for helping keep Brain Entrainer secure!
