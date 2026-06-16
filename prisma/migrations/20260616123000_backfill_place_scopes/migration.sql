WITH known_states(slug) AS (
  VALUES
    ('andhra-pradesh'),
    ('assam'),
    ('bengal'),
    ('gujarat'),
    ('karnataka'),
    ('kerala'),
    ('madhya-pradesh'),
    ('maharashtra'),
    ('odisha'),
    ('orissa'),
    ('rajasthan'),
    ('tamil-nadu'),
    ('uttar-pradesh'),
    ('uttarakhand'),
    ('uttarkhand'),
    ('west-bengal')
)
UPDATE "Place"
SET "placeScope" = 'state',
    "parentStateId" = NULL
FROM known_states
WHERE "Place"."slug" = known_states.slug;

WITH known_locality_states(place_slug, state_slug) AS (
  VALUES
    ('akkalkot', 'maharashtra'),
    ('alandi', 'maharashtra'),
    ('amravati', 'maharashtra'),
    ('arunachala', 'tamil-nadu'),
    ('badrinath', 'uttarakhand'),
    ('bangalore', 'karnataka'),
    ('bhavnath', 'gujarat'),
    ('burdwan', 'west-bengal'),
    ('bardwan', 'west-bengal'),
    ('calcutta', 'west-bengal'),
    ('cuttack', 'odisha'),
    ('cuttack-orissa', 'odisha'),
    ('dwaraka', 'gujarat'),
    ('girnar', 'gujarat'),
    ('guntur', 'andhra-pradesh'),
    ('haridwar', 'uttarakhand'),
    ('hubli', 'karnataka'),
    ('jabalpur', 'madhya-pradesh'),
    ('jaipur', 'rajasthan'),
    ('jodhpur', 'rajasthan'),
    ('junagadh', 'gujarat'),
    ('kolhapur', 'maharashtra'),
    ('kopargaon', 'maharashtra'),
    ('majuli-assam', 'assam'),
    ('mayapur', 'west-bengal'),
    ('mumbai', 'maharashtra'),
    ('nagpur', 'maharashtra'),
    ('narasimha-wadi', 'maharashtra'),
    ('navadwip', 'west-bengal'),
    ('nellore', 'andhra-pradesh'),
    ('pandharpur', 'maharashtra'),
    ('pune', 'maharashtra'),
    ('pune-india', 'maharashtra'),
    ('puri', 'odisha'),
    ('puri-orissa', 'odisha'),
    ('pushkar', 'rajasthan'),
    ('radha-kund', 'uttar-pradesh'),
    ('rajkot-virpur', 'gujarat'),
    ('rishikesh', 'uttarakhand'),
    ('serampur', 'west-bengal'),
    ('shirdi', 'maharashtra'),
    ('sri-rangam', 'tamil-nadu'),
    ('thiruvananthpuram', 'kerala'),
    ('varanasi', 'uttar-pradesh'),
    ('vrindavan', 'uttar-pradesh'),
    ('vrindavan-india', 'uttar-pradesh')
)
UPDATE "Place" locality
SET "placeScope" = 'locality',
    "parentStateId" = state."id"
FROM known_locality_states
JOIN "Place" state ON state."slug" = known_locality_states.state_slug
WHERE locality."slug" = known_locality_states.place_slug
  AND locality."id" <> state."id";
