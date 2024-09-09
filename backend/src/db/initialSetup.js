const { getDbPool } = require('./index');
const bcrypt = require('bcryptjs');

async function ensureDatabaseSchema() {
    let client;
    try {
        const pool = await getDbPool(); // Await the resolution of the pool
        client = await pool.connect();  // Attempt to get a client from the pool
        const result = await client.query("SELECT to_regclass('public.client');");
        
        if (result.rows[0].to_regclass === null) {
            console.log("Database schema is not set up. Initializing...");
            await setupDatabaseSchema(client);  // Set up database schema if not already set up
        } else {
            console.log("Database schema already set up.");
        }

        await checkAndCreateAdmin(client);

    } catch (error) {
        console.error("Failed to ensure database schema:", error);
        throw error;  // Optionally re-throw the error if you want calling functions to handle it
    } finally {
        if (client) {
            client.release();  // Always release the client if it was obtained
        }
    }
}

async function setupDatabaseSchema(client) {
    const queryText = `
    CREATE TABLE client (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        street_address VARCHAR(255),
        mailing_address VARCHAR(255),
        phone VARCHAR(20),
        city VARCHAR(100),
        state VARCHAR(100),
        zip VARCHAR(10),
        lat NUMERIC(9,6),
        long NUMERIC(9,6),
        hours JSONB,
        special_days JSONB,
        email VARCHAR(255),
        web VARCHAR(255),
        social JSONB
    );
    `;

    const queryStaff = `
    CREATE TABLE staff (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255),
        mailing_address VARCHAR(255),
        phone VARCHAR(20),
        city VARCHAR(100),
        state VARCHAR(100),
        zip VARCHAR(10),
        title VARCHAR(255),
        image_url VARCHAR(255),
        about TEXT
    );
    `;

    const queryLogin = `
    CREATE TABLE login (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER,
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );
    `;

    const queryClientSettings = `
    CREATE TABLE client_settings (
        id SERIAL PRIMARY KEY,
        mode VARCHAR(50),
        time_zone VARCHAR(50),
        ad_campaigns JSONB
    );
    `;

    const queryBusinesses = `
    CREATE TABLE businesses (
        id SERIAL PRIMARY KEY,
        active BOOLEAN DEFAULT false,
        name VARCHAR(255),
        street_address VARCHAR(255),
        mailing_address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        zip VARCHAR(10),
        lat NUMERIC(9,6),
        long NUMERIC(9,6),
        phone VARCHAR(20),
        email VARCHAR(255),
        web VARCHAR(255),
        social_platforms JSONB,
        images TEXT[],  -- Array of image URLs
        description TEXT,
        chamber_member BOOLEAN DEFAULT false
    );
    `;

    const queryEat = `
    CREATE TABLE eat (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        cost INTEGER REFERENCES eat_cost(id),
        name VARCHAR(255),
        phone VARCHAR(20),
        hours JSONB,
        special_days JSONB,
        email VARCHAR(255),
        web VARCHAR(255),
        social_platforms JSONB,
        images TEXT[],
        description TEXT,
        logo TEXT
    );
    `;

    const queryEatType = `
    CREATE TABLE eat_type (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
    );
    `;

    const queryEatToEatType = `
    CREATE TABLE eat_eat_type (
        eat_id INTEGER NOT NULL,
        type_id INTEGER NOT NULL,
        PRIMARY KEY (eat_id, type_id),
        FOREIGN KEY (eat_id) REFERENCES eat(id) ON DELETE CASCADE,
        FOREIGN KEY (type_id) REFERENCES eat_type(id) ON DELETE CASCADE
    );
    `;

    const queryEatCost = `
    CREATE TABLE eat_cost (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) UNIQUE NOT NULL,
        description VARCHAR(255)
    );
    `;

    const queryEatCostInput = `
    INSERT INTO eat_cost (symbol, description) VALUES
    ('$', 'Under $10'),
    ('$$', '$10 to 20'),
    ('$$$', '$20 to 40'),
    ('$$$$', '$40 to 60'),
    ('$$$$$', 'Above $60');
    `;

    const queryPlay = `
    CREATE TABLE play (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        web VARCHAR(255),
        hours JSONB,
        social_platforms JSONB,
        images TEXT[],
        ad_banner VARCHAR(255),
        description TEXT
    );
    `;

    const queryPlayType = `
    CREATE TABLE play_type (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
    );
    `;

    const queryPlayToPlayType = `
    CREATE TABLE play_play_type (
        play_id INTEGER NOT NULL,
        type_id INTEGER NOT NULL,
        PRIMARY KEY (play_id, type_id),
        FOREIGN KEY (play_id) REFERENCES play(id) ON DELETE CASCADE,
        FOREIGN KEY (type_id) REFERENCES play_type(id) ON DELETE CASCADE
    );
    `;

    const queryStay = `
    CREATE TABLE stay (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        cost_id INTEGER REFERENCES stay_cost(id) ON DELETE SET NULL,
        name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        web VARCHAR(255),
        social_platforms JSONB,
        images TEXT[],  -- Array of image URLs for multiple uploads
        ad_banner VARCHAR(255),  -- URL to image file for the advertisement banner
        description TEXT
    );
    `;

    const queryStayType = `
    CREATE TABLE stay_type (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
    );
    `;

    const queryStayToStayType = `
    CREATE TABLE stay_stay_type (
        stay_id INTEGER NOT NULL,
        type_id INTEGER NOT NULL,
        PRIMARY KEY (stay_id, type_id),
        FOREIGN KEY (stay_id) REFERENCES stay(id) ON DELETE CASCADE,
        FOREIGN KEY (type_id) REFERENCES stay_type(id) ON DELETE CASCADE
    );
    `;

    const queryStayPrice = `
    CREATE TABLE stay_cost (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) UNIQUE NOT NULL,
        description VARCHAR(255)
    );
    `;

    const queryStayPriceInput = `
    INSERT INTO stay_cost (symbol, description) VALUES
    ('$', 'Under $50'),
    ('$$', '$50 to $100'),
    ('$$$', '$100 to $200'),
    ('$$$$', '$200 to $500'),
    ('$$$$$', 'Over $500');
    `;

    const queryShop = `
    CREATE TABLE shop (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        web VARCHAR(255),
        hours JSONB,
        social_platforms JSONB,
        images TEXT[],  -- Array of image URLs for multiple uploads
        ad_banner VARCHAR(255),  -- URL to image file for the advertisement banner
        description TEXT
    );
    `;

    const queryShopType = `
    CREATE TABLE shop_type (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
    );
    `;

    const queryShopToShopType = `
    CREATE TABLE shop_shop_type (
        shop_id INTEGER NOT NULL,
        type_id INTEGER NOT NULL,
        PRIMARY KEY (shop_id, type_id),
        FOREIGN KEY (shop_id) REFERENCES shop(id) ON DELETE CASCADE,
        FOREIGN KEY (type_id) REFERENCES shop_type(id) ON DELETE CASCADE
    );
    `;

    const queryOther = `
    CREATE TABLE other (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        web VARCHAR(255),
        hours JSONB,
        social_platforms JSONB,
        images TEXT[],  -- Array of image URLs for multiple uploads
        ad_banner VARCHAR(255),  -- URL to image file for the advertisement banner
        description TEXT
    );
    `;

    const queryOtherType = `
    CREATE TABLE other_type (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
    );
    `;

    const queryOtherToOtherType = `
    CREATE TABLE other_other_type (
        other_id INTEGER NOT NULL,
        type_id INTEGER NOT NULL,
        PRIMARY KEY (other_id, type_id),
        FOREIGN KEY (other_id) REFERENCES other(id) ON DELETE CASCADE,
        FOREIGN KEY (type_id) REFERENCES other_type(id) ON DELETE CASCADE
    );
    `;

    const queryVenue = `
    CREATE TABLE venue (
        id SERIAL PRIMARY KEY,
        business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        smallest_group INTEGER,
        largest_group INTEGER,
        name VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        web VARCHAR(255),
        hours JSONB,
        social_platforms JSONB,
        images TEXT[],  -- Array of image URLs for multiple uploads
        ad_banner VARCHAR(255),  -- URL to image file for the advertisement banner
        description TEXT
    );
    `;

    const queryVenueType = `
    CREATE TABLE venue_type (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
    );
    `;

    const queryVenueLocationType = `
    CREATE TABLE venue_location_type (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
    );
    `;

    const queryVenueToVenueType = `
    CREATE TABLE venue_venue_type (
        venue_id INTEGER NOT NULL,
        type_id INTEGER NOT NULL,
        PRIMARY KEY (venue_id, type_id),
        FOREIGN KEY (venue_id) REFERENCES venue(id) ON DELETE CASCADE,
        FOREIGN KEY (type_id) REFERENCES venue_type(id) ON DELETE CASCADE
    );
    `;

    const queryVenueToVenueLocationType = `
    CREATE TABLE venue_venue_location_type (
        venue_id INTEGER NOT NULL,
        location_type_id INTEGER NOT NULL,
        PRIMARY KEY (venue_id, location_type_id),
        FOREIGN KEY (venue_id) REFERENCES venue(id) ON DELETE CASCADE,
        FOREIGN KEY (location_type_id) REFERENCES venue_location_type(id) ON DELETE CASCADE
    );
    `;

    const queryBusinessCategories = `
    CREATE TABLE business_categories (
        business_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        category_type VARCHAR(50),  -- 'eat', 'play', 'stay', 'shop', 'venue', 'other'
        PRIMARY KEY (business_id, category_id, category_type),
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );
    `;

    const queryEvents = `
    CREATE TABLE events (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        street_address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        zip VARCHAR(10),
        lat NUMERIC(9,6),
        long NUMERIC(9,6),
        start_date DATE,
        end_date DATE,
        start_time TIME,
        end_time TIME,
        description TEXT,
        images TEXT[],  -- Array of image URLs for multiple uploads
        phone VARCHAR(20),
        email VARCHAR(255),
        web VARCHAR(255),
        social_platforms JSONB
    );
    `;


    await client.query('BEGIN');
    try {
    await client.query(queryText);
    console.log("Client table created.");
    await client.query(queryStaff);
    console.log("Staff table created.");
    await client.query(queryLogin);
    console.log("Login table created.");
    await client.query(queryClientSettings);
    console.log("Client settings table created.");
    await client.query(queryBusinesses);
    console.log("Businesses table created.");
    await client.query(queryEatCost);
    console.log("Eat Type table created.");
    await client.query(queryEat);
    console.log("Eat table created.");
    await client.query(queryEatType);
    console.log("Eat Type table created.");
    await client.query(queryEatToEatType);
    console.log("Eat Type table created.");
    await client.query(queryPlay);
    console.log("Play table created.");
    await client.query(queryPlayType);
    console.log("Play Type table created.");
    await client.query(queryPlayToPlayType);
    console.log("Play to Play Type table created.");
    await client.query(queryStayPrice);
    console.log("Stay Price table created.");
    await client.query(queryStay);
    console.log("Stay table created.");
    await client.query(queryStayType);
    console.log("Stay Type table created.");
    await client.query(queryStayToStayType);
    console.log("Stay to Stay Type table created.");
    await client.query(queryShop);
    console.log("Shop table created.");
    await client.query(queryShopType);
    console.log("Shop Type table created.");
    await client.query(queryShopToShopType);
    console.log("Shop to Shop Type table created.");
    await client.query(queryOther);
    console.log("Other table created.");
    await client.query(queryOtherType);
    console.log("Other Type table created.");
    await client.query(queryOtherToOtherType);
    console.log("Other to Other Type table created.");
    await client.query(queryVenue);
    console.log("Venue table created.");
    await client.query(queryVenueType);
    console.log("Venue Type table created.");
    await client.query(queryVenueLocationType);
    console.log("Venue Location Type table created.");
    await client.query(queryVenueToVenueType);
    console.log("Venue to Venue Type table created.");
    await client.query(queryVenueToVenueLocationType);
    console.log("Venue to Venue Location Type table created.");
    await client.query(queryBusinessCategories);
    console.log("Business Categories table created.");
    await client.query(queryEvents);
    console.log("Events table created.");

    await client.query(queryEatCostInput);
    console.log("Eat Type table populated.");
    await client.query(queryStayPriceInput);
    console.log("Stay Price table populated.");

    await client.query('COMMIT');  // Commit all changes
    console.log("All tables created and populated successfully.");
} catch (error) {
    await client.query('ROLLBACK');  // Rollback on error
    console.error("Failed to setup database schema:", error);
    throw error;
}
}


module.exports = { ensureDatabaseSchema };
