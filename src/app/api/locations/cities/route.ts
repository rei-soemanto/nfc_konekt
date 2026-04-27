import { NextResponse } from 'next/server';
import { Country, State, City } from 'country-state-city';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const countryName = searchParams.get('country');
    const stateName = searchParams.get('state');

    if (!countryName || !stateName) return NextResponse.json([]);

    const country = Country.getAllCountries().find(c => c.name === countryName);
    if (!country) return NextResponse.json([]);

    const state = State.getStatesOfCountry(country.isoCode).find(s => s.name === stateName);
    if (!state) return NextResponse.json([]);

    const cities = City.getCitiesOfState(country.isoCode, state.isoCode).map(c => c.name);

    return NextResponse.json([...new Set(cities)]);
}