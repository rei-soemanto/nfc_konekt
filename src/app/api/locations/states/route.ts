import { NextResponse } from 'next/server';
import { Country, State } from 'country-state-city';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const countryName = searchParams.get('country');

    if (!countryName) return NextResponse.json([]);

    const country = Country.getAllCountries().find(c => c.name === countryName);
    if (!country) return NextResponse.json([]);

    const states = State.getStatesOfCountry(country.isoCode).map(s => s.name);
    
    return NextResponse.json(states);
}