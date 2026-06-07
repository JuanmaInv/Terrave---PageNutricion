import { EncuestasService } from "../../src/encuestas/encuestas.service";

function buildRepositoryMock() {
  return {
    createCalls: [],
    createSessionCalls: [],
    updateSessionCalls: [],
    async create(dto, id, fecha) {
      this.createCalls.push({ dto, id, fecha });
      return { id, fecha };
    },
    async createSession(id, dto) {
      this.createSessionCalls.push({ id, dto });
      return {
        id,
        fecha_inicio: "2026-06-03T10:00:00.000Z",
        fecha_actualizacion: "2026-06-03T10:05:00.000Z",
      };
    },
    async updateSession(id, dto) {
      this.updateSessionCalls.push({ id, dto });
      return {
        id,
        fecha_inicio: "2026-06-03T10:00:00.000Z",
        fecha_actualizacion: "2026-06-03T10:06:00.000Z",
      };
    },
  };
}

describe("EncuestasService", () => {
  it("debe delegar el guardado de encuestas al repository y conservar la fecha explícita", async () => {
    const repository = buildRepositoryMock();
    const service = new EncuestasService(repository);
    const dto = {
      date: "2026-06-03T12:00:00.000Z",
      sex: "femenino",
      diet: "omnivoro",
      attrs: {
        color: 4,
        aroma: 4,
        firmeza: 4,
        untuosidad: 4,
        sabor_tostado: 4,
        persistencia: 4,
      },
      acceptance: 4,
      liked: "si",
      consumeAgain: "si",
      recommend: 4,
    };

    const created = await service.create(dto);

    expect(repository.createCalls).toHaveLength(1);
    expect(repository.createCalls[0].fecha).toBe(dto.date);
    expect(created.fecha).toBe(dto.date);
    expect(created.id).toBeTruthy();
  });

  it("debe generar fecha automáticamente y soportar comentarios y sesión asociados", async () => {
    const repository = buildRepositoryMock();
    const service = new EncuestasService(repository);
    const dto = {
      sessionId: "session-1",
      sex: "femenino",
      diet: "omnivoro",
      attrs: {
        color: 5,
        aroma: 5,
        firmeza: 5,
        untuosidad: 5,
        sabor_tostado: 5,
        persistencia: 5,
      },
      descriptiveComments: "Muy buen sabor",
      acceptance: 5,
      liked: "si",
      consumeAgain: "si",
      recommend: 5,
      affectiveComments: "Lo compraría",
    };

    const created = await service.create(dto);

    expect(repository.createCalls).toHaveLength(1);
    expect(repository.createCalls[0].fecha).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(created.id).toBeTruthy();
  });

  it("debe crear una sesión técnica y delegarla al repository", async () => {
    const repository = buildRepositoryMock();
    const service = new EncuestasService(repository);
    const dto = {
      clientSessionKey: "client-1",
      currentStep: 1,
      sex: "femenino",
      diet: "omnivoro",
    };

    const session = await service.createSession(dto);

    expect(repository.createSessionCalls).toHaveLength(1);
    expect(repository.createSessionCalls[0].dto).toBe(dto);
    expect(repository.createSessionCalls[0].id).toBeTruthy();
    expect(session.id).toBe(repository.createSessionCalls[0].id);
  });

  it("debe crear una sesión aunque currentStep no venga informado", async () => {
    const repository = buildRepositoryMock();
    const service = new EncuestasService(repository);
    const dto = {
      clientSessionKey: "client-2",
      sex: "otro",
    };

    const session = await service.createSession(dto);

    expect(repository.createSessionCalls).toHaveLength(1);
    expect(repository.createSessionCalls[0].dto).toBe(dto);
    expect(session.id).toBe(repository.createSessionCalls[0].id);
  });

  it("debe actualizar una sesión usando el id provisto", async () => {
    const repository = buildRepositoryMock();
    const service = new EncuestasService(repository);
    const dto = {
      clientSessionKey: "client-1",
      currentStep: 3,
      willingnessToPay: "4500",
    };

    const session = await service.updateSession("session-123", dto);

    expect(repository.updateSessionCalls).toHaveLength(1);
    expect(repository.updateSessionCalls[0].id).toBe("session-123");
    expect(repository.updateSessionCalls[0].dto).toBe(dto);
    expect(session.id).toBe("session-123");
  });

  it("debe actualizar una sesión aunque no venga currentStep", async () => {
    const repository = buildRepositoryMock();
    const service = new EncuestasService(repository);
    const dto = {
      clientSessionKey: "client-1",
      affectiveComments: "Comentario final",
    };

    const session = await service.updateSession("session-999", dto);

    expect(repository.updateSessionCalls).toHaveLength(1);
    expect(repository.updateSessionCalls[0].id).toBe("session-999");
    expect(session.id).toBe("session-999");
  });

  it("debe soportar comentarios vacíos o solo espacios sin romper el guardado", async () => {
    const repository = buildRepositoryMock();
    const service = new EncuestasService(repository);
    const dto = {
      sex: "masculino",
      diet: "otro",
      attrs: {
        color: 3,
        aroma: 3,
        firmeza: 3,
        untuosidad: 3,
        sabor_tostado: 3,
        persistencia: 3,
      },
      descriptiveComments: "   ",
      acceptance: 3,
      liked: "no",
      consumeAgain: "tal_vez",
      recommend: 3,
      affectiveComments: "",
    };

    const created = await service.create(dto);

    expect(repository.createCalls).toHaveLength(1);
    expect(created.id).toBeTruthy();
  });
});
