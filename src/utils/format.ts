// Utility helpers for response formatting.
// Intentionally style-inconsistent only — no functional or security issues.

export function formatUserLabel ( userName:string,userId:number ):string
{
  var label = "User:" + " " + userName


  var id_part = '(' + userId + ')'

  return label + " " + id_part
}

export function format_list_summary(items: string[]): string {
    if(items.length===0){return "empty"}

    let Summary = items.length + " item(s): "

    for(var i=0;i<items.length;i++)
    {
      Summary = Summary + items[i]
      if ( i < items.length - 1 )
      {
        Summary=Summary+", "
      }
    }

    return Summary
}

export function pad_right(value:string,width:number):string{
  var result=value
  while(result.length<width){
    result=result+" "
  }
  return result
}
