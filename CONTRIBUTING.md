# Contributing to SISWISP

Thank you for your interest in contributing to SISWISP! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- Git

### Quick Setup

#### Windows
```bash
setup.bat
```

#### Linux/Mac
```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup

**Backend:**
```bash
cd siswisp_backend/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python create_admin_user.py
python run.py
```

**Frontend:**
```bash
cd siswisp_frontend/siswisp-frontend
npm install
npm start
```

## Development Workflow

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/wisp.git
   cd wisp
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Keep commits focused and descriptive
   - Test your changes locally

4. **Test Backend**
   ```bash
   cd siswisp_backend/backend
   source venv/bin/activate
   python -m pytest  # if tests exist
   ```

5. **Test Frontend**
   ```bash
   cd siswisp_frontend/siswisp-frontend
   npm test
   npm run build
   ```

6. **Commit with clear messages**
   ```bash
   git add .
   git commit -m "feat: Add new feature description"
   ```

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**
   - Reference any related issues
   - Describe what your changes do
   - Explain why the changes are necessary

## Code Style

### Backend (Python/Flask)
- Follow PEP 8 guidelines
- Use type hints where possible
- Keep functions focused and testable
- Document complex logic with comments

Example:
```python
def create_client(name: str, email: str, phone: str) -> Client:
    """Create a new client record.
    
    Args:
        name: Client full name
        email: Client email address
        phone: Client phone number
        
    Returns:
        Client: The newly created client object
    """
    # Implementation here
    pass
```

### Frontend (React)
- Use functional components with hooks
- Keep components focused and reusable
- Use meaningful variable names
- Add PropTypes or TypeScript annotations

Example:
```javascript
import PropTypes from 'prop-types';

const ClientCard = ({ client, onEdit, onDelete }) => {
  return (
    <div className="client-card">
      {/* Component content */}
    </div>
  );
};

ClientCard.propTypes = {
  client: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default ClientCard;
```

## Commit Message Format

Use conventional commits for clarity:

```
feat: Add new feature
fix: Fix bug description
docs: Update documentation
style: Format code (no functional change)
refactor: Reorganize code
test: Add or update tests
chore: Update dependencies
```

Example:
```
feat: Add client status filtering

- Implement status filter dropdown
- Add ACTIVE/SUSPENDED/CANCELLED filters
- Update client list API endpoint
```

## Testing

### Backend Tests
```bash
cd siswisp_backend/backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd siswisp_frontend/siswisp-frontend
npm test
```

### Manual Testing Checklist
- [ ] Backend API starts without errors
- [ ] Frontend builds successfully
- [ ] All pages load correctly
- [ ] Authentication works (login/register)
- [ ] API endpoints respond correctly
- [ ] CORS headers are correct
- [ ] No console errors in browser

## Documentation

- Update README.md if adding features
- Update SETUP.md if changing setup process
- Add docstrings to new functions
- Document complex algorithms

## Reporting Issues

Use GitHub Issues with:
1. **Clear title** describing the problem
2. **Description** with steps to reproduce
3. **Expected behavior** vs actual behavior
4. **Environment** (OS, Python version, etc.)
5. **Screenshots** if relevant

## Security

- Do NOT commit secrets, API keys, or passwords
- Always use environment variables for sensitive data
- Report security issues privately to the maintainers

## Questions?

- Check existing documentation in README.md and SETUP.md
- Search GitHub Issues for similar questions
- Open a Discussion or Issue with your question

## Code Review Process

1. At least one maintainer review required
2. CI/CD pipeline must pass
3. No merge conflicts
4. Code style guidelines followed
5. Documentation updated if necessary

## License

By contributing, you agree your code will be licensed under the MIT License.

---

Thank you for contributing to SISWISP! 🚀
