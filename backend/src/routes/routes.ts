import { response, Router } from 'express'
import axios from 'axios'

const appRouter = Router()
const token = 'my-super-secret-auth-token'
const orgID = '35c407ac7211a661'

const proxy = axios.create({
  // url onde iremos buscar as informações do influxDB
  baseURL: 'http://localhost:8086',
  headers: {
    // Token que configuramos quando criamos nosso bucket, encontrasse no .env do influxDB
    Authorization: `Token ${token}`,
    'Content-Type': 'application/json'
  }
})
// url que nosso frontend vai chamar.
appRouter.get('/plot/:type', async (req, res) => {
  //Query que iremos fazer ao influxDB
  // Type irá definir qual tipo de gráfico iremos requisitar
  const getQuery = () => {
    switch (req.params.type) {
      case 'scatter':
        return `from(bucket: "bucket1")
        |> range(start: -5m)
        |> filter(fn: (r) => r["_measurement"] == "weather")
        |> filter(fn: (r) => r["_field"] == "temp")
        |> filter(fn: (r) => r["host"] == "7d8ec276ad54")
        |> filter(fn: (r) => r["temp"] == "quarto/temperatura")
        |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)`
      default:
        return `from(bucket: "bucket1")
        |> range(start: -5m)
        |> filter(fn: (r) => r["_measurement"] == "weather")
        |> filter(fn: (r) => r["_field"] == "temp")
        |> filter(fn: (r) => r["host"] == "7d8ec276ad54")
        |> filter(fn: (r) => r["temp"] == "quarto/temperatura")
        |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)`
    }
  }
  try {
    const response = await proxy.request({
      // método post por padrão
      method: 'post',
      //influxv2
      url: '/api/v2/query',
      params: {
        // ID da organização
        orgID
      },
      data: {
        // Eliminando espaços em branco do final
        query: getQuery().trim(),
        extern: {
          type: 'File',
          package: null,
          imports: null,
          body: [
            {
              type: 'OptionStatement',
              assignment: {
                type: 'VariableAssignment',
                id: { type: 'Identifier', name: 'v' },
                init: {
                  type: 'ObjectExpression',
                  properties: [
                    {
                      type: 'Property',
                      key: { type: 'Identifier', name: 'bucket' },
                      value: { type: 'StringLiteral', value: '' }
                    },
                    {
                      type: 'Property',
                      key: { type: 'Identifier', name: 'timeRangeStart' },
                      value: {
                        type: 'UnaryExpression',
                        operator: '-',
                        argument: {
                          type: 'DurationLiteral',
                          values: [{ magnitude: 5, unit: 'm' }]
                        }
                      }
                    },
                    {
                      type: 'Property',
                      key: { type: 'Identifier', name: 'timeRangeStop' },
                      value: {
                        type: 'CallExpression',
                        callee: { type: 'Identifier', name: 'now' }
                      }
                    },
                    {
                      type: 'Property',
                      key: { type: 'Identifier', name: 'windowPeriod' },
                      value: {
                        type: 'DurationLiteral',
                        values: [{ magnitude: 10000, unit: 'ms' }]
                      }
                    }
                  ]
                }
              }
            }
          ]
        },
        dialect: { annotations: ['group', 'datatype', 'default'] }
      }
    })
    console.log(response)

    res.status(200).send(response.data)
  } catch (err) {
    console.log(err)
    res.status(400).send({
      err
    })
  }
})

export { appRouter }
