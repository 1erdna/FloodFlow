const database = db.getSiblingDB("floodflow");

const names = [
  "users",
  "coverageareas",
  "streets",
  "floodreports",
  "advisories",
  "assistancerequests",
];

names.forEach((n) => {
  if (database.getCollectionNames().includes(n)) database[n].drop();
});

const oid = { bsonType: "objectId" };
const oidOrNull = { bsonType: ["objectId", "null"] };
const date = { bsonType: "date" };
const dateOrNull = { bsonType: ["date", "null"] };
const str = { bsonType: "string" };
const strOrNull = { bsonType: ["string", "null"] };

//users
database.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "password_hash", "role", "created_at"],
      properties: {
        name: { bsonType: "string", minLength: 2, maxLength: 100 },
        email: str,
        password_hash: str,
        role: { enum: ["commuter", "admin"] },
        coverage_area_id: oidOrNull,
        created_at: date,
        updated_at: date,
      },
    },
  },
});
database.users.createIndex({ email: 1 }, { unique: true });
database.users.createIndex({ role: 1, coverage_area_id: 1 });

//coverageareas
database.createCollection("coverageareas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "barangay", "city", "district", "is_coastal_riverfront", "is_active", "created_at"],
      properties: {
        name: str,
        barangay: str,
        city: str,
        district: { enum: ["first_district", "second_district"] },
        is_coastal_riverfront: { bsonType: "bool" },
        description: strOrNull,
        is_active: { bsonType: "bool" },
        created_at: date,
        updated_at: date,
      },
    },
  },
});
database.coverageareas.createIndex({ barangay: 1, city: 1 }, { unique: true });
database.coverageareas.createIndex({ district: 1, is_active: 1 });

//streets
database.createCollection("streets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "coverage_area_id", "is_active", "created_at"],
      properties: {
        name: { bsonType: "string", minLength: 2, maxLength: 150 },
        coverage_area_id: oid,
        latitude: { bsonType: ["double", "null"], minimum: -90, maximum: 90 },
        longitude: { bsonType: ["double", "null"], minimum: -180, maximum: 180 },
        connected_street_ids: { bsonType: "array", items: oid },
        is_active: { bsonType: "bool" },
        created_at: date,
        updated_at: date,
      },
    },
  },
});
database.streets.createIndex({ coverage_area_id: 1, name: 1 });
database.streets.createIndex({ name: "text" });
// NOTE: flood_status is NOT stored. The API computes it from floodreports.

//floodreports
database.createCollection("floodreports", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["street_id", "severity", "observed_at", "expires_at", "status", "created_at", "updated_at"],
      properties: {
        street_id: oid,
        reporter_id: oidOrNull,
        severity: { enum: ["low", "moderate", "high", "severe"] },
        description: { bsonType: ["string", "null"], maxLength: 500 },
        observed_at: date,
        expires_at: date, // observed_at + 6 hours
        status: { enum: ["pending", "verified", "rejected", "resolved"] },
        verified_by: oidOrNull,
        verified_at: dateOrNull,
        verification_reason: { bsonType: ["string", "null"], maxLength: 300 },
        resolved_at: dateOrNull,
        created_at: date,
        updated_at: date,
      },
    },
  },
});
database.floodreports.createIndex({ street_id: 1, observed_at: -1 });
database.floodreports.createIndex({ reporter_id: 1, status: 1 });
database.floodreports.createIndex({ status: 1, expires_at: 1 });

//advisories
database.createCollection("advisories", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "message", "advisory_type", "level", "starts_at", "expires_at", "created_at", "updated_at"],
      properties: {
        title: { bsonType: "string", minLength: 3, maxLength: 150 },
        message: { bsonType: "string", minLength: 3, maxLength: 1000 },
        advisory_type: { enum: ["rain", "flood_warning", "evacuation", "general"] },
        level: { enum: ["info", "watch", "warning", "critical"] },
        coverage_area_id: oidOrNull, // null = city-wide
        created_by: oidOrNull,
        starts_at: date,
        expires_at: date,
        created_at: date,
        updated_at: date,
      },
    },
  },
});
database.advisories.createIndex({ starts_at: 1, expires_at: 1 });
database.advisories.createIndex({ coverage_area_id: 1, advisory_type: 1 });

//assistancerequests
database.createCollection("assistancerequests", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "street_id", "coverage_area_id", "request_type", "description",
        "contact_number", "number_of_people", "status", "created_at", "updated_at",
      ],
      properties: {
        requester_id: oidOrNull,
        street_id: oid,
        coverage_area_id: oid, // copied from the street
        report_id: oidOrNull,
        request_type: { enum: ["rescue", "evacuation", "medical", "supplies", "other"] },
        description: { bsonType: "string", minLength: 5, maxLength: 500 },
        contact_number: str,
        number_of_people: { bsonType: "int", minimum: 1, maximum: 100 },
        status: { enum: ["open", "acknowledged", "in_progress", "resolved", "cancelled"] },
        status_note: { bsonType: ["string", "null"], maxLength: 300 },
        handled_by: oidOrNull,
        created_at: date,
        updated_at: date,
        resolved_at: dateOrNull,
      },
    },
  },
});
database.assistancerequests.createIndex({ requester_id: 1, status: 1 });
database.assistancerequests.createIndex({ coverage_area_id: 1, status: 1, created_at: -1 });

printjson(
  names.map((n) => ({ collection: n, documents: database[n].countDocuments() }))
);
