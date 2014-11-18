#!/usr/bin/perl -w
use strict;
use JSON;

my %precinct_name = (
    1 => 'Walker-Jones EC',
    2 => 'The School Without Walls',
    3 => 'St. Paul’s Parish',
    4 => 'School Without Walls@Francis-Stevens',
    5 => 'Christ Episcopal Church',
    6 => 'Georgetown Community Library',
    7 => 'Hardy Recreation Center',
    8 => 'Palisades Recreation Center',
    9 => 'Metropolitan Memorial United Methodist Church',
    10 => 'Horace Mann Community Center',
    11 => 'Guy Mason Recreation Center',
    12 => 'St. Sophia’s Greek Orthodox Cathedral Church',
    13 => 'Our Lady Queen of the Americas',
    14 => 'St. Thomas’ Episcopal Parish',
    15 => 'Foundry United Methodist Church',
    16 => 'Fifteenth Street Presbyterian Church',
    17 => 'Metropolitan AME Church',
    18 => 'Kennedy Recreation Center',
    19 => 'Dunbar Senior High School',
    20 => 'Washington Metropolitan High School',
    21 => 'Watha T. Daniel-Shaw Community Library',
    22 => 'Ellington @Garnet-Patterson',
    23 => 'Rita Bright Community Center',
    24 => 'Marie Reed Learning Center',
    25 => 'Goodwill Baptist Church',
    26 => 'Oyster School',
    27 => 'Eaton School',
    28 => 'Annunciation Parish Church',
    29 => 'Second District Police Station',
    30 => 'Janney School',
    31 => 'St. Columba’s Episcopal Church',
    32 => 'Wesley Methodist Church',
    33 => 'Murch School',
    34 => 'Edmund Burke School',
    35 => 'H.D. Cooke School',
    36 => 'Latin American Youth Center',
    37 => 'Banneker Community Recreation Center',
    38 => 'Cesar Chavez Prep Charter School',
    39 => 'Columbia Heights Education Campus',
    40 => 'Bancroft School',
    41 => 'Trinity AME Zion Church',
    42 => 'Mt. Rona Baptist Church',
    43 => 'Park View Community Center',
    44 => 'Ukrainian National Shrine',
    45 => 'MPD - Regional Operation Command (North)',
    46 => 'E.L. Haynes Public Charter School @Clark',
    47 => 'Powell School',
    48 => 'Sharpe Health School',
    49 => 'Raymond Recreation Center',
    50 => 'Chevy Chase Community Center',
    51 => 'Lafayette School',
    52 => 'St. John’s College High School',
    53 => 'Brightwood Elementary School',
    54 => 'West Elementary School',
    55 => 'Barnard Elementary School',
    56 => 'Truesdell Elementary School',
    57 => 'Hattie Holmes Wellness Center',
    58 => 'Fourth District Police Station',
    59 => 'Coolidge Sr. High School',
    60 => 'Nativity Youth Center',
    61 => 'Fort Stevens Recreation Center',
    62 => 'Shepherd Elementary School',
    63 => 'Takoma Education Campus',
    64 => 'Lamond Recreation Center',
    65 => 'LaSalle Elementary School',
    66 => 'UDC Community College @Backus',
    67 => 'Bunker Hill Elementary School',
    68 => 'St. Francis Hall',
    69 => 'Perry Street Preparatory PCS @Taft',
    70 => 'Burroughs Elementary School',
    71 => 'Mt. Horeb Baptist Church Annex',
    72 => 'Model Cities Senior Wellness Center',
    73 => 'M. M. Bethune Day Academy @Slowe',
    74 => 'Noyes Education Campus',
    75 => 'McKinley Technology Senior High School',
    76 => 'Bethesda Baptist Church',
    77 => 'Joseph H. Cole Recreation Center',
    78 => 'Trinidad Recreation Center',
    79 => 'Browne Education Campus',
    80 => 'St. Benedict the Moor Church',
    81 => 'Miner Elementary School',
    82 => 'Sherwood Recreation Center',
    83 => 'J.O. Wilson Elementary School',
    84 => 'Stuart-Hobson Middle School',
    85 => 'The Specialty Hospital of Washington',
    86 => 'Eliot Jr. High School',
    87 => 'Payne Elementary School',
    88 => 'Thankful Baptist Church',
    89 => 'Eastern Market',
    90 => 'Tyler Elementary School',
    91 => 'Watkins Elementary School',
    92 => 'Kenilworth Elementary School',
    93 => 'Houston Elementary School',
    94 => 'Burrville Elementary School',
    95 => 'Drew Elementary School',
    96 => 'Hughes Memorial United Methodist Church',
    97 => 'Kelly Miller Middle School',
    98 => 'Smothers Elementary School',
    99 => 'Smothers Elementary School',
    100 => 'Thomas Elementary School',
    101 => 'Beyond the Veil Worship Center',
    102 => 'Benning Public Library',
    103 => 'Plummer Elementary School',
    104 => 'Nalle Elementary School',
    105 => 'Harris School',
    106 => 'Davis Elementary School',
    107 => 'Sousa Middle School',
    108 => 'Pennsylvania Avenue Baptist Church',
    109 => 'Randle-Highlands Elementary School',
    110 => 'St. Timothy’s Episcopal Church',
    111 => 'St. Francis Xavier Church',
    112 => 'Anacostia Public Library',
    113 => 'East River Washington Senior Wellness Center',
    114 => 'Union Temple Baptist Church',
    115 => 'Seventh District Police Station',
    116 => 'The ARC',
    117 => 'Turner Elementary School',
    118 => 'Moten Elementary School',
    119 => 'Matthews Memorial Baptist Church',
    120 => 'Malcolm X Elementary School',
    121 => 'Ferebee-Hope Recreation Center',
    122 => 'Ballou Senior High School',
    123 => 'Martin Luther King Elementary School',
    124 => 'Covenant Baptist United Church of Christ',
    125 => 'Hendley School',
    126 => 'W.B. Patterson Elementary School',
    127 => 'King Greenleaf Recreation Center',
    128 => 'Friendship Baptist Church',
    129 => 'Martin Luther King Library',
    130 => 'Lutheran Church of the Reformation',
    131 => 'Van Ness Elementary School',
    132 => 'D.C. Center for Therapeutic Recreation',
    133 => 'Orr School',
    134 => 'Allen AME Church',
    135 => 'Mt. Bethel Baptist Church',
    136 => 'Leading Age',
    137 => 'Garrison Elementary School',
    138 => 'Capital Memorial Adventist Church',
    139 => 'Theodore Hagan Cultural Center',
    140 => 'Anacostia Sr. High School',
    141 => 'Frank D. Reeves Municipal Center',
    142 => 'Jefferson Jr. High School',
    143 => 'Chinese Community Church',
);

@ARGV = ('November_4_2014_General_Election_Unofficial_Results.csv') if not @ARGV;
$_ = <>;
chomp;
my @v;
my %ward;
my @columns = map { chomp; s/["\r\n]//g; lc } split /,/;
while (<>) {
    s/\s+$//;
    s/^"//; s/"$//;
    my %r;
    @r{@columns} = split /","/;
    next if $r{candidate} =~ /ER VOTES$/ or $r{contest_name} =~ /^ADVISORY NEIGHBORHOOD/;
    my $contest = $r{contest_name};
    my $candidate = $r{candidate};
    my $precinct = $r{precinct_number} + 0;
    if ($contest =~ /- TOTAL/) {
        $contest =~ s/ .*//;
        $v[$precinct]{$contest} = $r{votes} + 0;
        next;
    }
    $contest =~ s/ - /-/;
    $contest =~ s/(\w+)/\u\L$1/g;
    $contest =~ s/(?<= )(Of|The)(?= )/\L$1/g;
    $contest =~ s/(?: of the)? District of Columbia//;
    $contest =~ s/One/1/;
    $contest =~ s/Three/3/;
    $contest =~ s/Five/5/;
    $contest =~ s/Six/6/;
    $candidate =~ s/ INITIATIVE 71//;
    $candidate =~ s/.* //;
    $candidate =~ s/(\w+)/\u\L$1/g;
    $candidate = '[Write-in]' if $candidate eq 'Write-In';
    $candidate =~ s/^Labeaume/LaBeaume/;
    if ($ward{$r{precinct_number}} && $ward{$r{precinct_number}} != $r{ward}) {
        warn "Precinct $r{precinct_number} is Ward $ward{$r{precinct_number}}" .
            " and $r{ward}\n";
    }
    $ward{$r{precinct_number}} = $r{ward} + 0;
    $v[$precinct]{$contest}{$candidate} = $r{votes} + 0;
}
print to_json(\@v, {canonical => 1});

@ARGV = ('dc-precincts-2012.json');
$/ = undef;
$_ = <>;
my $data = decode_json($_);
for my $f (@{$data->{features}}) {
    my $pct = $f->{properties}{Description} =~ /Precinct (\d+)/ ? $1 : 0;
    $f->{id} = $pct + 0;
    $f->{properties} = {
        ward => $ward{$pct},
        name => $precinct_name{$pct},
    };
    $f->{geometry} = $f->{geometry}{geometries}[1];
}
#print to_json($data, {canonical => 1});
warn scalar(@{$data->{features}}), " precincts\n";
