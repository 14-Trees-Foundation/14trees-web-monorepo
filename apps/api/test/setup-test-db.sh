#!/bin/bash

# Database setup script for tests
echo "🗄️  Setting up test database..."

# Auto-detect current user for PostgreSQL
CURRENT_USER="$(whoami)"
echo "📝 Detected system user: $CURRENT_USER"

# Database credentials - auto-detect user
DB_HOST="localhost"
DB_PORT="5432" 
DB_NAME="14trees_test"
# Use current system user for PostgreSQL connection
DB_USER="$CURRENT_USER"
DB_PASSWORD=""

# Update .env.test with detected user
echo "⚙️  Updating .env.test with detected user..."
sed -i.bak "s/^POSTGRES_USER=.*/POSTGRES_USER=$DB_USER/" .env.test
echo "✅ Updated POSTGRES_USER=$DB_USER in .env.test"

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running on $DB_HOST:$DB_PORT"
    echo "Please start PostgreSQL service:"
    echo "  macOS: brew services start postgresql"
    echo "  Linux: sudo systemctl start postgresql"
    exit 1
fi

# Check if user exists in PostgreSQL, create if not
echo "👤 Checking if PostgreSQL user '$DB_USER' exists..."
USER_EXISTS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER';" 2>/dev/null || echo "")

if [ -z "$USER_EXISTS" ]; then
    echo "🔧 Creating PostgreSQL user '$DB_USER'..."
    # Try to create user as superuser (this might need adjustment based on PostgreSQL setup)
    psql -h $DB_HOST -p $DB_PORT -c "CREATE USER \"$DB_USER\" SUPERUSER;" 2>/dev/null || {
        echo "⚠️  Could not create user as superuser, trying as current user..."
        # If we can't create as superuser, the user might already have access
    }
else
    echo "✅ PostgreSQL user '$DB_USER' already exists"
fi

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running on $DB_HOST:$DB_PORT"
    echo "Please start PostgreSQL service:"
    echo "  macOS: brew services start postgresql"
    echo "  Linux: sudo systemctl start postgresql"
    exit 1
fi

# Drop and recreate test database
echo "🧹 Dropping existing test database..."
dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER --if-exists $DB_NAME 2>/dev/null || echo "Database didn't exist or couldn't be dropped"

echo "🏗️  Creating test database..."
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME || {
    echo "❌ Failed to create database. Trying alternative method..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE \"$DB_NAME\";" || {
        echo "❌ Could not create test database. Please check PostgreSQL permissions."
        exit 1
    }
}

echo "📋 Creating basic tables..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Ensure we're working in the public schema
SET search_path TO public;

-- Create tables in dependency order

-- First, create tables with no foreign key dependencies
CREATE TABLE IF NOT EXISTS public.sites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district VARCHAR(255),
    taluka VARCHAR(255),
    village VARCHAR(255),
    land_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.plant_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    image VARCHAR(500),
    tree_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    birth_date DATE,
    pin VARCHAR(10),
    roles TEXT[],
    status VARCHAR(50),
    status_message TEXT[],
    last_system_updated_at TIMESTAMP,
    rfr VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Then create tables that reference the above tables
CREATE TABLE IF NOT EXISTS public.plots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    boundary TEXT,
    area DECIMAL(10,2),
    site_id INTEGER REFERENCES public.sites(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.ponds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    depth DECIMAL(8,2),
    boundary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.trees (
    id SERIAL PRIMARY KEY,
    sapling_id VARCHAR(100) UNIQUE NOT NULL,
    plant_type_id INTEGER REFERENCES public.plant_types(id),
    plot_id INTEGER REFERENCES public.plots(id),
    image VARCHAR(500),
    tags TEXT[],
    location JSONB,
    planted_by VARCHAR(255),
    mapped_to_user INTEGER REFERENCES public.users(id),
    mapped_to_group INTEGER,
    mapped_at TIMESTAMP,
    sponsored_by_user INTEGER REFERENCES public.users(id),
    sponsored_by_group INTEGER,
    sponsored_at TIMESTAMP,
    gifted_by INTEGER REFERENCES public.users(id),
    gifted_by_name VARCHAR(255),
    gifted_to INTEGER REFERENCES public.users(id),
    assigned_at TIMESTAMP,
    assigned_to INTEGER REFERENCES public.users(id),
    user_tree_image VARCHAR(500),
    user_card_image VARCHAR(500),
    memory_images TEXT[],
    event_id INTEGER,
    donation_id INTEGER,
    visit_id INTEGER,
    description TEXT,
    event_type VARCHAR(100),
    tree_status VARCHAR(50),
    status VARCHAR(50),
    status_message TEXT[],
    last_system_updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.onsitestaffs (
    _id VARCHAR(100) PRIMARY KEY,
    id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    user_id VARCHAR(100),
    phone BIGINT,
    email VARCHAR(255) UNIQUE NOT NULL,
    image VARCHAR(500),
    role VARCHAR(100),
    permissions TEXT,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dob DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE,
    site_id INTEGER REFERENCES public.sites(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.donations (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10,2),
    amount_received DECIMAL(10,2),
    user_id INTEGER REFERENCES public.users(id),
    contribution_options TEXT[],
    mail_status TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.gift_cards (
    id SERIAL PRIMARY KEY,
    type VARCHAR(100),
    status VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.gift_card_requests (
    id SERIAL PRIMARY KEY,
    request_type VARCHAR(100),
    amount DECIMAL(10,2),
    amount_received DECIMAL(10,2),
    user_id INTEGER REFERENCES public.users(id),
    group_id INTEGER REFERENCES public.groups(id),
    no_of_cards INTEGER DEFAULT 1,
    tags TEXT[],
    contribution_options TEXT[],
    mail_status TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.tree_count_aggregations (
    id SERIAL PRIMARY KEY,
    plot_id INTEGER REFERENCES public.plots(id),
    plant_type_id INTEGER REFERENCES public.plant_types(id),
    total INTEGER DEFAULT 0,
    booked INTEGER DEFAULT 0,
    assigned INTEGER DEFAULT 0,
    available INTEGER DEFAULT 0,
    void_total INTEGER DEFAULT 0,
    void_booked INTEGER DEFAULT 0,
    void_assigned INTEGER DEFAULT 0,
    void_available INTEGER DEFAULT 0,
    card_available INTEGER DEFAULT 0,
    unbooked_assigned INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.user_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id),
    group_id INTEGER REFERENCES public.groups(id),
    role VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.albums (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES public.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trees_plant_type ON public.trees(plant_type_id);
CREATE INDEX IF NOT EXISTS idx_trees_mapped_to_user ON public.trees(mapped_to_user);
CREATE INDEX IF NOT EXISTS idx_trees_plot ON public.trees(plot_id);
CREATE INDEX IF NOT EXISTS idx_trees_status ON public.trees(status);
CREATE INDEX IF NOT EXISTS idx_trees_created_at ON public.trees(created_at);
CREATE INDEX IF NOT EXISTS idx_plots_site ON public.plots(site_id);
CREATE INDEX IF NOT EXISTS idx_donations_user ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_requests_user ON public.gift_card_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_requests_group ON public.gift_card_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_tree_count_aggregations_plot ON public.tree_count_aggregations(plot_id);
CREATE INDEX IF NOT EXISTS idx_tree_count_aggregations_plant_type ON public.tree_count_aggregations(plant_type_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_user ON public.user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group ON public.user_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_albums_user ON public.albums(user_id);

EOF

echo "✅ Test database setup completed successfully!"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""
echo "🎯 You can now run tests with: npm test"