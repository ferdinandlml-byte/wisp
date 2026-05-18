#!/usr/bin/env python
"""
SISWISP Backend Application Entry Point
Handles Flask app initialization and startup with proper error handling.
"""

import os
import sys
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Initialize and run the Flask application."""
    
    # Set environment variables
    os.environ.setdefault('FLASK_ENV', 'production')
    os.environ.setdefault('PYTHONUNBUFFERED', '1')
    
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 10000))
    
    logger.info(f"Python {sys.version}")
    logger.info(f"Current working directory: {Path.cwd()}")
    logger.info(f"Application directory: {Path(__file__).parent.absolute()}")
    
    try:
        # Import Flask app
        logger.info("Importing Flask application...")
        from app.main import app
        logger.info("✓ Flask application imported successfully")
        
        # Check database
        logger.info("Initializing database...")
        from app.core.database import Base, engine
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Database initialized")
        
        # Run Flask development server (Render will handle production WSGI)
        logger.info(f"Starting Flask server on 0.0.0.0:{port}")
        app.run(
            host='0.0.0.0',
            port=port,
            debug=False,
            threaded=True,
            use_reloader=False
        )
        
    except ImportError as e:
        logger.error(f"Failed to import Flask application: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to start application: {e}", exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    main()
