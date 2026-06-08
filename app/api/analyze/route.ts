import { NextRequest, NextResponse } from "next/server";

const ETRI_URL_WRITTEN = "http://epretx.etri.re.kr:8000/api/WiseNLU";
const ETRI_URL_SPOKEN = "http://epretx.etri.re.kr:8000/api/WiseNLU_spoken";

export async function POST(req: NextRequest) {
  try {
    const accessKey = process.env.ETRI_API_KEY;
    if (!accessKey) {
      return NextResponse.json({ error: "서버에 API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    const { analysisCode, text, mode } = await req.json();

    if (!analysisCode || !text) {
      return NextResponse.json(
        { error: "analysisCode, text 는 필수 항목입니다." },
        { status: 400 }
      );
    }

    const apiUrl = mode === "spoken" ? ETRI_URL_SPOKEN : ETRI_URL_WRITTEN;

    const etriResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        Authorization: accessKey,
      },
      body: JSON.stringify({
        argument: { text, analysis_code: analysisCode },
      }),
    });

    const data = await etriResponse.json();
    return NextResponse.json({ status: etriResponse.status, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다. API 서버 연결을 확인하세요." },
      { status: 500 }
    );
  }
}
