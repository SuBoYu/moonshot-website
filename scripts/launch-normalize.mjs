// Shared by scripts/update-launches.mjs (snapshot) and the browser (live refresh).
// The build inlines this file into /launches/, so keep it dependency-free and
// limited to syntax that runs unchanged in both Node and browsers.

/** ISO-8601 duration ("-PT38M", "PT1H2M3S", "P1DT2H") to signed seconds, or null. */
export function durationSeconds(value) {
  const match = /^(-)?P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(String(value ?? ''));
  if (!match) return null;
  const [, sign, d, h, m, s] = match;
  const total = (+d || 0) * 86400 + (+h || 0) * 3600 + (+m || 0) * 60 + Math.round(+s || 0);
  return sign ? -total : total;
}

const text = value => (typeof value === 'string' ? value.trim() : '');
const number = value => (Number.isFinite(+value) && value !== null && value !== '' ? +value : null);

function landing(raw) {
  if (!raw || raw.attempt === false) return raw ? { attempt: false } : null;
  return {
    attempt: true,
    success: typeof raw.success === 'boolean' ? raw.success : null,
    site: text(raw.landing_location?.abbrev) || text(raw.landing_location?.name),
    siteName: text(raw.landing_location?.name),
    type: text(raw.type?.abbrev),
    note: text(raw.description),
  };
}

/** Reduce one Launch Library 2 (v2.3.0, mode=detailed) launch to the fields the page renders. */
export function normalizeLaunch(raw) {
  const config = raw.rocket?.configuration ?? {};
  const [vehicleName, ...rest] = text(raw.name).split('|');
  const missionName = text(rest.join('|')) || text(raw.mission?.name) || text(raw.name);
  const flight = /(?:Starship\s+)?(?:Integrated\s+)?Flight(?:\s+Test)?\s*(\d+)?/i.exec(missionName);
  const isStarship = /starship/i.test(config.name ?? vehicleName);
  const webcast = (raw.vid_urls ?? []).slice().sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))[0];
  const update = (raw.updates ?? [])[0];
  return {
    id: text(raw.id),
    name: missionName,
    net: text(raw.net),
    precision: text(raw.net_precision?.abbrev) || 'MIN',
    windowStart: text(raw.window_start),
    windowEnd: text(raw.window_end),
    status: text(raw.status?.abbrev) || 'TBD',
    statusName: text(raw.status?.name),
    failReason: text(raw.failreason),
    vehicle: text(config.name) || text(vehicleName),
    vehicleFull: text(config.full_name) || text(config.name) || text(vehicleName),
    // Starship's first flight is named "Integrated Flight Test" with no number.
    flightNumber: isStarship && flight ? +(flight[1] ?? 1) : null,
    missionType: text(raw.mission?.type),
    orbit: text(raw.mission?.orbit?.name),
    orbitCode: text(raw.mission?.orbit?.abbrev),
    description: text(raw.mission?.description),
    pad: text(raw.pad?.name),
    site: text(raw.pad?.location?.name),
    lat: number(raw.pad?.latitude),
    lon: number(raw.pad?.longitude),
    boosters: (raw.rocket?.launcher_stage ?? []).map(stage => ({
      serial: text(stage.launcher?.serial_number),
      flight: number(stage.launcher_flight_number),
      reused: stage.reused === true,
      role: text(stage.type),
      landing: landing(stage.landing),
    })),
    spacecraft: (raw.rocket?.spacecraft_stage ?? []).map(stage => ({
      name: text(stage.spacecraft?.name),
      type: text(stage.spacecraft?.spacecraft_config?.name),
      destination: text(stage.destination),
      landing: landing(stage.landing),
    })),
    timeline: (raw.timeline ?? [])
      .map(event => ({ t: durationSeconds(event.relative_time), label: text(event.type?.abbrev) }))
      .filter(event => event.t !== null && event.label)
      .sort((a, b) => a.t - b.t),
    webcast: /^https:\/\//.test(webcast?.url ?? '') ? webcast.url : '',
    live: raw.webcast_live === true,
    update: update ? { at: text(update.created_on), text: text(update.comment) } : null,
    count: number(raw.agency_launch_attempt_count),
    countYear: number(raw.agency_launch_attempt_count_year),
    updatedAt: text(raw.last_updated),
  };
}

/** Provider-wide totals, read from any detailed launch record. */
export function normalizeAgency(raw) {
  const agency = raw?.launch_service_provider ?? {};
  return {
    launches: number(agency.total_launch_count),
    successes: number(agency.successful_launches),
    streak: number(agency.consecutive_successful_launches),
    landings: number(agency.successful_landings),
    landingAttempts: number(agency.attempted_landings),
    pending: number(agency.pending_launches),
  };
}
